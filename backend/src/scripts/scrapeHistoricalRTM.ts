import { PrismaClient } from '@prisma/client';
import puppeteer, { Page } from 'puppeteer';

const prisma = new PrismaClient();

function parseNumber(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/,/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function formatDateToDDMMYYYY(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

async function scrapeDay(page: Page, dateStr: string) {
  console.log(`\n--- Scraping ${dateStr} ---`);
  
  await page.goto('https://www.iexindia.com/market-data/real-time-market/market-snapshot', { waitUntil: 'networkidle2' });
  
  const selectHandles = await page.$$('.MuiSelect-select');
  if (selectHandles.length >= 2) {
    await selectHandles[1].click();
    await new Promise(r => setTimeout(r, 500));
    
    // click -Select Range-
    const options = await page.$$('li[role="option"]');
    for (const opt of options) {
      const text = await page.evaluate((el: any) => el.textContent, opt);
      if (text === '-Select Range-') {
        await opt.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate((targetDate: string) => {
       const inputs = Array.from(document.querySelectorAll('input')).filter(i => i.placeholder === 'DD-MM-YYYY');
       if (inputs.length >= 2) {
         const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
         if (nativeInputValueSetter) {
             nativeInputValueSetter.call(inputs[0], targetDate);
             inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
             nativeInputValueSetter.call(inputs[1], targetDate);
             inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
         }
       }
    }, dateStr);
    
    await new Promise(r => setTimeout(r, 500));
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const updateBtn = btns.find(b => b.innerText.includes('Update Report'));
      if (updateBtn) updateBtn.click();
    });
    
    console.log(`Waiting for table to load...`);
    await new Promise(r => setTimeout(r, 5000));
    
    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const columns = Array.from(row.querySelectorAll('td'));
        return columns.map(c => (c as HTMLElement).innerText.trim());
      });
    });

    return data;
  }
  return [];
}

async function runChunkedScraper(startDateStr: string, endDateStr: string) {
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let currentDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  while (currentDate <= endDate) {
    const formattedDate = formatDateToDDMMYYYY(currentDate);
    const deliveryDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0));
    
    try {
      const data = await scrapeDay(page, formattedDate);
      
      const recordsToInsert: any[] = [];
      for (const row of data) {
        if (!row || row.length < 5) continue;
        const timeBlockIdx = row.findIndex((c: string) => c && c.includes(':') && c.includes('-'));
        if (timeBlockIdx === -1) continue;

        const timeBlock = row[timeBlockIdx];
        const [start] = timeBlock.split('-');
        if (!start) continue;
        const [hh, mm] = start.split(':').map(Number);
        const intervalNumber = (hh * 4) + (mm / 15) + 1;
        const offset = timeBlockIdx;

        recordsToInsert.push({
          intervalNumber,
          intervalTime: start.trim(),
          sessionId: String(row[offset - 1] || '1'),
          purchaseBid: parseNumber(row[offset + 1] ?? '0'),
          sellBid: parseNumber(row[offset + 2] ?? '0'),
          mcv: parseNumber(row[offset + 3] ?? '0'),
          fsv: parseNumber(row[offset + 4] ?? '0'),
          mcp: parseNumber(row[offset + 5] ?? '0'),
        });
      }
      
      if (recordsToInsert.length > 0) {
        let dataset = await prisma.dataset.findFirst({
          where: { market: 'RTM', deliveryDate }
        });

        if (dataset) {
          console.log(`[${formattedDate}] Updating existing dataset with ${recordsToInsert.length} records...`);
          await prisma.rtmRecord.deleteMany({ where: { datasetId: dataset.id } });
        } else {
          console.log(`[${formattedDate}] Creating new dataset with ${recordsToInsert.length} records...`);
          dataset = await prisma.dataset.create({
            data: {
              market: 'RTM',
              deliveryDate,
              fileName: `scraped_rtm_historical_${formattedDate}.csv`,
              status: 'ACTIVE'
            }
          });
        }

        const recordsWithDatasetId = recordsToInsert.map(r => ({ ...r, datasetId: dataset!.id }));
        await prisma.rtmRecord.createMany({ data: recordsWithDatasetId });
        console.log(`[${formattedDate}] Successfully saved ${recordsToInsert.length} records!`);
      } else {
        console.log(`[${formattedDate}] No data found on IEX.`);
      }
    } catch (e: any) {
      console.error(`[${formattedDate}] Error scraping: ${e.message}`);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Add random delay between 2-5 seconds to evade anti-bot detection
    const delay = Math.floor(Math.random() * 3000) + 2000;
    await new Promise(r => setTimeout(r, delay));
  }

  await browser.close();
  console.log('\n--- Historical Scraping Complete ---');
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: npx ts-node scrapeHistoricalRTM.ts <start-date-YYYY-MM-DD> <end-date-YYYY-MM-DD>');
  process.exit(1);
} else {
  runChunkedScraper(args[0], args[1]).catch(console.error);
}
