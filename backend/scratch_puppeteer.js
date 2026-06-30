const puppeteer = require('puppeteer');

async function scrape() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Log all network requests to see if there is an API we can call instead
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('json') || url.includes('Market')) {
      console.log('Response URL:', url);
    }
  });

  await page.goto('https://www.iexindia.com/market-data/day-ahead-market/market-snapshot', { waitUntil: 'networkidle2' });
  
  // Wait for the table to render
  await page.waitForSelector('table');
  
  // Extract data from the table
  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.slice(0, 5).map(row => {
      const columns = Array.from(row.querySelectorAll('td'));
      return columns.map(c => c.innerText.trim());
    });
  });
  
  console.log('Sample Data from table:', data);
  
  await browser.close();
}

scrape().catch(console.error);
