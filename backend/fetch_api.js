const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('request', request => {
    if (request.url().includes('webapi')) {
      console.log('REQUEST:', request.method(), request.url(), request.postData());
    }
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('webapi')) {
      try {
        const text = await response.text();
        console.log('RESPONSE:', url, text.substring(0, 1000));
      } catch (e) {}
    }
  });

  await page.goto('https://grid-india.in/en/markets/transmission-losses', { waitUntil: 'networkidle2' });
  await browser.close();
})();
