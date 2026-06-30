const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://vidyutpravah.in/', { waitUntil: 'networkidle2' });
  
  const text = await page.evaluate(() => {
    return document.body.innerHTML;
  });
  
  require('fs').writeFileSync('vidyut.html', text);
  await browser.close();
  console.log('Saved to vidyut.html');
}
run();
