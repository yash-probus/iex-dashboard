import puppeteer from 'puppeteer';

async function main() {
  console.log('Launching Puppeteer inside container...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Listen to network requests and responses
    page.on('request', request => {
      const url = request.url();
      if (url.includes('api') || url.includes('json') || request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
        console.log(`[Request] [${request.method()}] [${request.resourceType()}] -> ${url}`);
      }
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('api') || url.includes('json') || response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
        console.log(`[Response] [${response.status()}] -> ${url}`);
        try {
          const text = await response.text();
          console.log(`[Payload Preview (first 300 chars)] -> ${text.substring(0, 300)}`);
        } catch (e) {}
      }
    });

    console.log('Navigating to https://www.iexindia.com/landed-cost-calculator ...');
    await page.goto('https://www.iexindia.com/landed-cost-calculator', {
      waitUntil: 'networkidle2',
      timeout: 90000
    });

    console.log('Page loaded. Waiting 10 seconds for background calls...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('Attempting to click dropdowns to trigger state loads...');
    // Let's print out all SELECT element IDs and options if present
    const selects = await page.$$eval('select', els => els.map(el => ({
      id: el.id,
      name: el.name,
      className: el.className,
      options: Array.from(el.options).map(o => o.value)
    })));
    console.log('Select elements found:', selects);

    // Let's also look for custom MUI dropdowns (since IEX uses Material UI, which renders divs instead of selects)
    const buttons = await page.$$eval('div[role="combobox"]', els => els.map(el => ({
      id: el.id,
      innerText: el.innerHTML
    })));
    console.log('Custom combobox divs found:', buttons);

  } catch (err: any) {
    console.error('Error during inspection:', err.message);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

main();
