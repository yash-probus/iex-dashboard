import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.goto('https://www.iexindia.com/market-data/green-day-ahead-market/market-snapshot', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

    await page.waitForSelector('table', { timeout: 15000 });

    const headers = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table thead tr'));
      return rows.map(row => {
        const columns = Array.from(row.querySelectorAll('th, td'));
        return columns.map(c => (c as HTMLElement).innerText.trim());
      });
    });

    console.log('GDAM Headers from IEX website:', JSON.stringify(headers, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

run();
