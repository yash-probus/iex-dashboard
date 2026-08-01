import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('https://www.iexindia.com/market-data/real-time-market/market-snapshot?interval=ONE_FOURTH_HOUR&dp=SELECT_RANGE&showGraph=false&toDate=01-07-2024&fromDate=01-07-2024', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    (document.body.style as any).zoom = '0.1';
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const data = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    return rows.map(row => {
      const columns = Array.from(row.querySelectorAll('td'));
      return columns.map(c => (c as HTMLElement).innerText.trim());
    });
  });
  
  console.log('Rows found:', data.length);
  if (data.length > 0) {
    console.log('First row:', data[0]);
  }
  
  await browser.close();
})();
