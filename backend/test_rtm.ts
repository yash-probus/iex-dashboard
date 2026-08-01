import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.iexindia.com/market-data/real-time-market/market-snapshot', { waitUntil: 'networkidle2' });
  
  await page.waitForSelector('table', { timeout: 15000 });
  const rows = await page.evaluate(() => {
    return document.querySelectorAll('table tbody tr').length;
  });
  
  const html = await page.evaluate(() => {
    return document.body.innerHTML.substring(0, 5000);
  });
  console.log('Rows found:', rows);
  
  // Check if there is a pagination dropdown
  const selects = await page.evaluate(() => {
    const sel = document.querySelectorAll('select');
    return Array.from(sel).map(s => s.outerHTML);
  });
  console.log('Selects:', selects);
  
  await browser.close();
})();
