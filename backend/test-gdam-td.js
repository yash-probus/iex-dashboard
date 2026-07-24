const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.iexindia.com/market-data/green-day-ahead-market/market-snapshot', { waitUntil: 'networkidle2' });
  await page.waitForSelector('table tbody tr', { timeout: 15000 });
  const rowData = await page.evaluate(() => {
    const row = document.querySelector('table tbody tr');
    return Array.from(row.querySelectorAll('td')).map((c, i) => `${i}: ${c.innerText.trim()}`);
  });
  console.log("Columns:", rowData);
  await browser.close();
})();
