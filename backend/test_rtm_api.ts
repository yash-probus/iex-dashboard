import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('api') || url.includes('json') || res.request().resourceType() === 'fetch' || res.request().resourceType() === 'xhr') {
      try {
        console.log('Intercepted:', url);
        if (url.includes('iexindia')) {
          const text = await res.text();
          console.log('Response snippet:', text.substring(0, 150));
        }
      } catch (e) {}
    }
  });

  await page.goto('https://www.iexindia.com/market-data/real-time-market/market-snapshot', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
