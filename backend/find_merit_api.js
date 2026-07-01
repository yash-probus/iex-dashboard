const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  
  const page = await browser.newPage();
  
  page.on('response', async (response) => {
    const req = response.request();
    if (req.resourceType() === 'fetch' || req.resourceType() === 'xhr') {
      const url = response.url();
      try {
        const text = await response.text();
        console.log('\n--- XHR/FETCH ---');
        console.log('URL:', url);
        console.log('Method:', req.method());
        console.log('Sample:', text.substring(0, 200));
        if (text.includes('00:03') || text.includes('00:07')) {
          console.log('>>> THIS HAS THE DATA! <<<');
        }
      } catch (e) {}
    }
  });

  console.log('Navigating to npp dashboard...');
  await page.goto('https://npp.gov.in/dashBoard/gc-map-dashboard-meritchart', { waitUntil: 'networkidle0', timeout: 60000 });
  
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Done.');
  await browser.close();
})();
