import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import axios from 'axios';

async function testScrape() {
  console.log('Testing Vidyut Pravah Scrape...');
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('api') || url.includes('.json') || response.headers()['content-type']?.includes('json')) {
        try {
          const text = await response.text();
          if (text.toLowerCase().includes('maharashtra') || text.toLowerCase().includes('demand')) {
            console.log('FOUND STATE JSON DATA AT URL:', url);
            console.log('Sample:', text.substring(0, 500));
          }
        } catch (e) {}
      }
    });

    // Wait for the state data to load.
    await page.goto('https://vidyutpravah.in/', { waitUntil: 'networkidle2', timeout: 60000 });
    
    const html = await page.content();
    console.log('Fetched HTML length:', html.length);
    
    // Let's see if we can find state data in the HTML or if it's rendered by JS.
    const hasMaharashtra = html.toLowerCase().includes('maharashtra');
    console.log('Contains Maharashtra?', hasMaharashtra);
    
    // Vidyut pravah loads an API call for state data.
    // We should intercept XHR requests to find the JSON.
    
    await browser.close();
  } catch (err) {
    console.error('Error during test scrape:', err);
  }
}

testScrape();
