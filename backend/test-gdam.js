const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.iexindia.com/market-data/green-day-ahead-market/market-snapshot', { waitUntil: 'networkidle2' });
  await page.waitForSelector('table', { timeout: 15000 });
  const headers = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll('table thead th'));
    return ths.map(th => th.innerText.trim()).filter(t => t.length > 0);
  });
  console.log("Headers found:", headers);
  await browser.close();
})();
