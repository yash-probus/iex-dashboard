const puppeteer = require('puppeteer');

async function testPortals() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Track APIs
  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('api') || url.endsWith('.json') || url.includes('demand')) {
      console.log('NPP URL:', url);
    }
  });

  try {
    console.log('Loading NPP...');
    await page.goto('https://npp.gov.in/', { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.log('NPP Error:', e.message);
  }

  // Clear listeners for next portal
  page.removeAllListeners('response');

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('api') || url.endsWith('.json') || url.includes('state')) {
      console.log('Vidyut URL:', url);
    }
  });

  try {
    console.log('Loading Vidyut Pravah...');
    await page.goto('https://vidyutpravah.in/', { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.log('Vidyut Error:', e.message);
  }

  await browser.close();
}

testPortals();
