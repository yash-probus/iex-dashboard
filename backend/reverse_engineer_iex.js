const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser to intercept IEX API calls...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const apiCalls = [];

  page.on('response', async (response) => {
    const request = response.request();
    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      console.log(`[${request.method()}] ${response.url()}`);
      if (response.url().includes('iex') || response.url().includes('api')) {
        try {
          const body = await response.text();
          if (body.length > 0 && body.length < 2000) {
            console.log(`Response Snippet: ${body.substring(0, 100)}...`);
          } else if (body.length > 0) {
            console.log(`Response Snippet (long): ${body.substring(0, 100)}...`);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  });

  try {
    await page.goto('https://www.iexindia.com/market-data/day-ahead-market/market-snapshot', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait a little bit for any background requests to finish
    await new Promise(r => setTimeout(r, 5000));
    
  } catch (err) {
    console.error('Error navigating:', err.message);
  } finally {
    console.log('Closing browser...');
    await browser.close();
  }
})();
