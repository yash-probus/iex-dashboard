const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('webapi')) {
      console.log('API URL:', url);
      try {
        const text = await response.text();
        console.log('API Response:', text.substring(0, 500));
      } catch (e) {}
    }
  });

  await page.goto('https://grid-india.in/en/markets/transmission-loss', { waitUntil: 'networkidle2' });
  await browser.close();
})();
