import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const requests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('api') || url.includes('json') || url.includes('dsm') || url.includes('.php') || request.method() === 'POST') {
      requests.push(`[${request.method()}] ${url}`);
    }
  });

  try {
    await page.goto('https://iexrtmprice.com/DSM_Data/', { waitUntil: 'networkidle2' });
    
    // Select Segment = DAM (value "1")
    await page.select('select[name="segment"]', '1');
    // Select Area = UP (value "N2_Uttar Pradesh")
    await page.select('#mySelect', 'N2_Uttar Pradesh');
    
    // Set dates
    await page.$eval('#fromDate', (el: any) => el.value = '2026-07-01');
    await page.$eval('#toDate', (el: any) => el.value = '2026-07-02');
    
    console.log('Clicking search...');
    await page.click('#submit_btn');
    
    await setTimeout(5000);
    
    console.log('Network Requests:', requests);
    
    // Dump tables
    const tables = await page.$$eval('table', tables => 
      tables.map(t => ({
        id: t.id,
        rows: t.rows.length
      }))
    );
    console.log('Tables:', tables);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

run();
