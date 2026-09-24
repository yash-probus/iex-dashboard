const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Intercept network requests
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('calculator') || url.includes('landed-cost') || url.includes('price')) {
            console.log('Intercepted:', url);
            try {
                if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
                    const text = await response.text();
                    console.log('Response body:', text.substring(0, 500));
                }
            } catch (e) {
                // ignore
            }
        }
    });

    await page.goto('https://www.iexindia.com/landed-cost-calculator', { waitUntil: 'networkidle2' });
    
    // Try to find the calculate button and click it or interact with the form
    // Since we just want to see if it makes a request on load, we wait a bit
    await new Promise(r => setTimeout(r, 3000));
    
    await browser.close();
})();
