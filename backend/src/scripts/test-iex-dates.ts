import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://iexrtmprice.com/DSM_Data/', { waitUntil: 'networkidle2' });
    
    // Dump all inputs
    const inputs = await page.$$eval('input', inputs => 
      inputs.map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        placeholder: i.placeholder
      }))
    );
    
    console.log('Inputs found:', JSON.stringify(inputs, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

run();
