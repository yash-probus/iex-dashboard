const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.iexindia.com/', { waitUntil: 'networkidle2' });
  
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => a.href).filter(href => href.includes('market-data'));
  });
  
  console.log(Array.from(new Set(links)));
  await browser.close();
})();
