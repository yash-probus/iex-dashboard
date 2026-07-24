import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://iexrtmprice.com/DSM_Data/', { waitUntil: 'networkidle2' });
    
    // Select GDAM (value '2')
    await page.select('select[name="segment"]', '2');
    
    // Select area (e.g. N2_Delhi)
    await page.select('#mySelect', 'N2_Delhi');
    
    // Test date before 13th
    await page.$eval('#fromDate', (el: any) => el.value = '10-07-2026');
    await page.$eval('#toDate', (el: any) => el.value = '10-07-2026');
    await page.click('#submit_btn');
    await new Promise(r => setTimeout(r, 4000));
    
    const headersBefore = await page.$$eval('#example thead tr th', ths => ths.map(th => th.textContent?.trim()));
    console.log('Headers before (10-07-2026):', headersBefore);

    // Test date after 13th
    await page.$eval('#fromDate', (el: any) => el.value = '15-07-2026');
    await page.$eval('#toDate', (el: any) => el.value = '15-07-2026');
    await page.click('#submit_btn');
    await new Promise(r => setTimeout(r, 4000));

    const headersAfter = await page.$$eval('#example thead tr th', ths => ths.map(th => th.textContent?.trim()));
    console.log('Headers after (15-07-2026):', headersAfter);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

run();
