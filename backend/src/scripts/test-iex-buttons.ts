import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://iexrtmprice.com/DSM_Data/', { waitUntil: 'networkidle2' });
    
    // Dump all buttons and a tags
    const buttons = await page.$$eval('button, a, input[type=submit], input[type=button]', elements => 
      elements.map(e => ({
        id: e.id,
        tagName: e.tagName,
        text: (e as HTMLElement).innerText?.trim() || (e as HTMLInputElement).value || '',
        class: e.className
      })).filter(e => e.text.match(/search|submit|view|show|get|go|export|download|excel|csv/i))
    );
    
    console.log('Buttons found:', JSON.stringify(buttons, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

run();
