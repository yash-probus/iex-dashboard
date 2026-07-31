const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.iexindia.com/market-data/REC-market-from-dec22', { waitUntil: 'networkidle2' });
  
  const headers = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table thead th')).map(th => th.innerText.trim());
  });
  
  const firstRow = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table tbody tr:first-child td')).map(td => td.innerText.trim());
  });

  console.log('Headers:', headers);
  console.log('First Row:', firstRow);
  
  await browser.close();
})();
