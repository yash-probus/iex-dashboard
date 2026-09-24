const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://www.iexindia.com/landed-cost-calculator', { waitUntil: 'networkidle2' });
    
    console.log('Page loaded');
    
    // Check if the form is already filled from the URL query params if we pass them
    await page.goto('https://www.iexindia.com/landed-cost-calculator?voltage=11&state=Uttar+Pradesh&consumerCategory=Industrial+General&todMonth=Apr+-+Sept&todSlot=RTC+(24+Hrs)&iexPrice=4.5', { waitUntil: 'networkidle2' });
    
    // Wait to see if table appears
    try {
        await page.waitForSelector('table', { timeout: 5000 });
        console.log('Table found!');
        
        // Extract data
        const results = await page.evaluate(() => {
            const data = {};
            document.querySelectorAll('tr').forEach(row => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length === 2) {
                    const key = cells[0].innerText.trim();
                    const val = cells[1].innerText.trim();
                    if (key && val) data[key] = val;
                }
            });
            return data;
        });
        
        console.log(results);
    } catch(e) {
        console.log('Table not found');
    }
    
    await browser.close();
})();
