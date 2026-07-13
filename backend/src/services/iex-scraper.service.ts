import puppeteer from 'puppeteer';
import { PrismaClient, MarketType } from '@prisma/client';
import { setTimeout } from 'timers/promises';

const prisma = new PrismaClient();

// Map DB State Names to IEX Area options
const IEX_STATE_MAPPING: Record<string, string> = {
  'Jammu and Kashmir': 'N1_J&K',
  'Himachal Pradesh': 'N1_Himachal Pradesh',
  'Chandigarh': 'N1_Chandigarh',
  'Haryana': 'N1_Haryana',
  'Uttar Pradesh': 'N2_Uttar Pradesh',
  'Uttarakhand': 'N2_Uttarakhand',
  'Rajasthan': 'N2_Rajasthan',
  'Delhi': 'N2_Delhi',
  'Punjab': 'N3_Punjab',
  'West Bengal': 'E1_West Bengal',
  'Sikkim': 'E1_Sikkim',
  'Bihar': 'E1_Bihar',
  'Jharkhand': 'E1_Jharkhand',
  'Odisha': 'E2_Odisha',
  'Madhya Pradesh': 'W1_MP',
  'Maharashtra': 'W2_Maharashtra',
  'Gujarat': 'W2_Gujarat',
  'Daman and Diu': 'W2_Daman and Diu',
  'Dadra and Nagar Haveli': 'W2_Dadar and Nagar Haveli',
  'Goa': 'W2_Goa (West)', // Assuming Goa is Goa (West)
  'Chhattisgarh': 'W3_Chhattisgarh',
  'Andhra Pradesh': 'S1_AP',
  'Telangana': 'S1_Telangana',
  'Karnataka': 'S1_Karnataka',
  'Tamil Nadu': 'S2_Tamil Nadu',
  'Puducherry': 'S2_Puducherry',
  'Tripura': 'A1_Tripura',
  'Meghalaya': 'A1_Meghalaya',
  'Manipur': 'A1_Manipur',
  'Mizoram': 'A1_Mizoram',
  'Nagaland': 'A1_Nagaland',
  'Assam': 'A2_Assam',
  'Arunachal Pradesh': 'A2_Arunachal Pradesh',
  'Kerala': 'S3_Kerala'
};

const MARKET_SEGMENT_MAPPING = {
  [MarketType.DAM]: '1',
  [MarketType.GDAM]: '2',
  [MarketType.RTM]: '3'
};

export class IexScraperService {
  
  async fetchMarketData(market: MarketType, dateString: string) {
    console.log(`[IEX Scraper] Starting scrape for ${market} on ${dateString}`);
    
    // Fetch unique states from DB
    const cityStates = await prisma.cityStateData.findMany({
      select: { stateName: true },
      distinct: ['stateName']
    });
    const dbStates = cityStates.map(s => s.stateName);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto('https://iexrtmprice.com/DSM_Data/', { waitUntil: 'networkidle2' });
      await page.select('select[name="segment"]', MARKET_SEGMENT_MAPPING[market as keyof typeof MARKET_SEGMENT_MAPPING]);
      
      for (const stateName of dbStates) {
        const iexValue = IEX_STATE_MAPPING[stateName];
        if (!iexValue) {
          console.warn(`[IEX Scraper] No IEX mapping found for state: ${stateName}`);
          continue;
        }

        console.log(`[IEX Scraper] Scraping ${stateName} (${iexValue})...`);
        
        // Select Area
        await page.select('#mySelect', iexValue);
        
        // Set dates
        await page.$eval('#fromDate', (el: any, d) => el.value = d, dateString);
        await page.$eval('#toDate', (el: any, d) => el.value = d, dateString);
        
        // Submit
        await page.click('#submit_btn');
        await setTimeout(4000); // Wait for table to load
        
        // Extract table
        const tableData = await page.$$eval('#example tbody tr', rows => {
          return rows.map(tr => {
            const tds = tr.querySelectorAll('td');
            if (tds.length < 8) return null;
            return {
              deliveryDate: tds[0].innerText.trim(),
              timePeriod: tds[1].innerText.trim(),
              purchaseBid: parseFloat(tds[3].innerText.trim() || '0'),
              sellBid: parseFloat(tds[4].innerText.trim() || '0'),
              mcv: parseFloat(tds[5].innerText.trim() || '0'),
              mcp: parseFloat(tds[7].innerText.trim() || '0'),
            };
          }).filter(r => r !== null);
        });

        if (tableData.length === 0) {
          console.log(`[IEX Scraper] No data found for ${stateName} on ${dateString}`);
          continue;
        }

        // Upsert into DB
        let successCount = 0;
        for (let i = 0; i < tableData.length; i++) {
          const row = tableData[i];
          if (!row) continue;
          
          const isoDate = new Date(dateString.split('-').reverse().join('-') + 'T00:00:00Z');
          
          await prisma.stateMarketRecord.upsert({
            where: {
              market_area_deliveryDate_intervalNumber: {
                market,
                area: stateName,
                deliveryDate: isoDate,
                intervalNumber: i + 1
              }
            },
            update: {
              purchaseBid: row.purchaseBid,
              sellBid: row.sellBid,
              clearedVolume: row.mcv,
              price: row.mcp,
              intervalTime: row.timePeriod
            },
            create: {
              market,
              area: stateName,
              deliveryDate: isoDate,
              intervalNumber: i + 1,
              intervalTime: row.timePeriod,
              purchaseBid: row.purchaseBid,
              sellBid: row.sellBid,
              clearedVolume: row.mcv,
              price: row.mcp
            }
          });
          successCount++;
        }
        console.log(`[IEX Scraper] Saved ${successCount} records for ${stateName}`);
      }
    } catch (error) {
      console.error(`[IEX Scraper] Error scraping ${market}:`, error);
    } finally {
      await browser.close();
    }
  }
}

export const iexScraperService = new IexScraperService();
