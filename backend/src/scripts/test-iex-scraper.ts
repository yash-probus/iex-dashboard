import puppeteer from 'puppeteer';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to IEX DSM...');
    await page.goto('https://iexrtmprice.com/DSM_Data/', { waitUntil: 'networkidle2' });
    
    // Dump all selects
    const selects = await page.$$eval('select', selects => 
      selects.map(s => ({
        id: s.id,
        name: s.name,
        options: Array.from(s.options).map(o => ({ value: o.value, text: o.text.trim() }))
      }))
    );
    
    console.log('Select elements found:', JSON.stringify(selects, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

run();
