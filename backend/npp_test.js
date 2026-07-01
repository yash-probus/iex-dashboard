const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('json') || url.includes('demand') || url.includes('data')) {
      console.log('API URL:', url);
    }
  });

  try {
    await page.goto('https://npp.gov.in/', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Loaded npp.gov.in successfully.');
  } catch(e) {
    console.log('Error loading npp:', e);
  }

  await browser.close();
})();
