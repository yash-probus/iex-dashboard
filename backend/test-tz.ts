import puppeteer from 'puppeteer';
async function test() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.emulateTimezone('Asia/Kolkata');
  const tz = await page.evaluate(() => new Date().toString());
  console.log(tz);
  await browser.close();
}
test();
