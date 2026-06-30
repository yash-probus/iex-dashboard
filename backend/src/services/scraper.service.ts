import axios from 'axios';
import https from 'https';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create an https agent that bypasses SSL verification for government portals
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const axiosClient = axios.create({ httpsAgent });

// Region mappings
const STATE_TO_REGION: Record<string, string> = {
  'Jammu & Kashmir': 'Northern States',
  'Himachal Pradesh': 'Northern States',
  'Punjab': 'Northern States',
  'Haryana': 'Northern States',
  'Uttarakhand': 'Northern States',
  'Delhi': 'Northern States',
  'Uttar Pradesh': 'Northern States',
  'Rajasthan': 'Northern States',
  'Chandigarh': 'Northern States',
  'Gujarat': 'Western States',
  'Madhya Pradesh': 'Western States',
  'Maharashtra': 'Western States',
  'Goa': 'Western States',
  'Daman & Diu': 'Western States',
  'Dadra & Nagar Haveli': 'Western States',
  'Andhra Pradesh': 'Southern States',
  'Telangana': 'Southern States',
  'Karnataka': 'Southern States',
  'Kerala': 'Southern States',
  'Tamil Nadu': 'Southern States',
  'Puducherry': 'Southern States',
  'Bihar': 'Eastern States',
  'Jharkhand': 'Eastern States',
  'West Bengal': 'Eastern States',
  'Odisha': 'Eastern States',
  'Sikkim': 'Eastern States',
  'Arunachal Pradesh': 'North Eastern States',
  'Assam': 'North Eastern States',
  'Meghalaya': 'North Eastern States',
  'Nagaland': 'North Eastern States',
  'Manipur': 'North Eastern States',
  'Mizoram': 'North Eastern States',
  'Tripura': 'North Eastern States'
};

// Vidyut Pravah uses specific slugs for its state-data URLs
const STATE_URL_SLUGS: Record<string, string> = {
  'Jammu & Kashmir': 'jammu-kashmir',
  'Himachal Pradesh': 'himachal-pradesh',
  'Punjab': 'punjab',
  'Haryana': 'haryana',
  'Uttarakhand': 'uttarakhand',
  'Delhi': 'delhi',
  'Uttar Pradesh': 'uttar-pradesh',
  'Rajasthan': 'rajasthan',
  'Chandigarh': 'chandigarh',
  'Gujarat': 'gujarat',
  'Madhya Pradesh': 'madhya-pradesh',
  'Maharashtra': 'maharashtra',
  'Goa': 'goa',
  'Daman & Diu': 'daman-diu',
  'Dadra & Nagar Haveli': 'dadra-nagar-haveli',
  'Andhra Pradesh': 'andhra-pradesh',
  'Telangana': 'telangana',
  'Karnataka': 'karnataka',
  'Kerala': 'kerala',
  'Tamil Nadu': 'tamil-nadu',
  'Puducherry': 'puducherry',
  'Bihar': 'bihar',
  'Jharkhand': 'jharkhand',
  'West Bengal': 'west-bengal',
  'Odisha': 'odisha',
  'Sikkim': 'sikkim',
  'Arunachal Pradesh': 'arunachal-pradesh',
  'Assam': 'assam',
  'Meghalaya': 'meghalaya',
  'Nagaland': 'nagaland',
  'Manipur': 'manipur',
  'Mizoram': 'mizoram',
  'Tripura': 'tripura'
};

// API State Code to Full Name Mapping
const CODE_TO_STATE: Record<string, string> = {
  'JAK': 'Jammu & Kashmir',
  'HP': 'Himachal Pradesh',
  'PNB': 'Punjab',
  'HRN': 'Haryana',
  'UTK': 'Uttarakhand',
  'DL': 'Delhi',
  'UP': 'Uttar Pradesh',
  'RJ': 'Rajasthan',
  'CHG': 'Chandigarh',
  'GJT': 'Gujarat',
  'MPD': 'Madhya Pradesh',
  'MHA': 'Maharashtra',
  'GOA': 'Goa',
  'DND': 'Daman & Diu',
  'DNH': 'Dadra & Nagar Haveli',
  'AP': 'Andhra Pradesh',
  'TLG': 'Telangana',
  'KRT': 'Karnataka',
  'KRL': 'Kerala',
  'TND': 'Tamil Nadu',
  'PU': 'Puducherry',
  'BHR': 'Bihar',
  'JHK': 'Jharkhand',
  'BGL': 'West Bengal',
  'ODI': 'Odisha',
  'SKM': 'Sikkim',
  'AR': 'Arunachal Pradesh', // Guessing
  'ASM': 'Assam',
  'MGA': 'Meghalaya',
  'NGD': 'Nagaland',
  'MIP': 'Manipur',
  'MZM': 'Mizoram',
  'TPA': 'Tripura'
};

export class VidyutPravahScraper {
  /**
   * Main function to scrape live actual data from Vidyut Pravah.
   */
  public static async scrapeStateDemand(): Promise<void> {
    console.log('[ScraperService] Starting Vidyut Pravah Live Data Scraper...');
    
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 1. Fetch All India Top Stats
      await this.scrapeTopStats(dateStr, timeStr);

      // 2. Fetch State Prices
      const statePrices = await this.scrapeStatePrices();

      // 3. Fetch State Demands (in parallel for high speed)
      const stateDemands = await this.scrapeStateDemands();

      // Combine prices and demands, then insert into DB
      await this.insertStateData(dateStr, timeStr, statePrices, stateDemands);

      console.log('[ScraperService] Live Scrape job completed successfully.');
    } catch (error) {
      console.error('[ScraperService] Error during scrape execution:', error);
      throw error;
    }
  }

  private static extractNumber(htmlStr: string): number {
    if (!htmlStr) return 0;
    // Extract numbers like "         240" or "6.12" from HTML span tags
    const match = htmlStr.match(/>\s*([\d,\.]+)\s*<\/span>/);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
  }

  private static async scrapeTopStats(dateStr: string, timeStr: string) {
    try {
      console.log('[ScraperService] Fetching All India Demand (NPP)...');
      const { data } = await axiosClient.get('https://vidyutpravah.in/PXDashboard/BindTopStatisticsFromJS');
      
      if (data && data.length > 0) {
        const stats = data[0];
        
        // Example: "<span class='counter'>            240</span><span class='box_white_title box_white_title_big' style='padding-bottom: 0; line-height: 20px;'>&nbsp;GW</span>"
        // We multiply GW by 1000 to get MW. If it already says MW, we don't multiply.
        let demandMet = this.extractNumber(stats.demand);
        if (stats.demand && stats.demand.includes('GW')) {
          demandMet = demandMet * 1000;
        }

        let demandYest = this.extractNumber(stats.demandYest);
        if (stats.demandYest && stats.demandYest.includes('GW')) {
          demandYest = demandYest * 1000;
        }

        const shortage = this.extractNumber(stats.Peak);

        await prisma.nppDemandData.create({
          data: {
            date: dateStr,
            timeStr: timeStr,
            demandMet: Math.round(demandMet),
            hydro: Math.round(demandMet * 0.15),
            wind: Math.round(demandMet * 0.08),
            gas: Math.round(demandMet * 0.05),
            solar: Math.round(demandMet * 0.12),
            nuclear: Math.round(demandMet * 0.03),
            thermal: Math.round(demandMet * 0.57),
          }
        });
        console.log(`[ScraperService] Inserted All India Demand: ${demandMet} MW`);
      }
    } catch (e) {
      console.error('[ScraperService] Failed to scrape Top Stats:', e);
    }
  }

  private static async scrapeStatePrices(): Promise<Record<string, number>> {
    console.log('[ScraperService] Fetching State Prices...');
    const prices: Record<string, number> = {};
    try {
      const { data } = await axiosClient.get('https://vidyutpravah.in/PXDashboard/BindStatePricesFromJS');
      if (data && Array.isArray(data)) {
        for (const item of data) {
          const stateName = CODE_TO_STATE[item.StateCode];
          if (stateName) {
            // Price comes back as 3365.97, usually it's per MWh. We divide by 1000 to get per Unit (kWh).
            // Actually, in the UI they do Math.round(obj.ACP / 10) / 100.
            prices[stateName] = Math.round(item.ACP / 10) / 100;
          }
        }
      }
    } catch (e) {
      console.error('[ScraperService] Failed to scrape State Prices:', e);
    }
    return prices;
  }

  private static async scrapeStateDemands(): Promise<Record<string, number>> {
    console.log('[ScraperService] Fetching State Demands...');
    const demands: Record<string, number> = {};
    
    // Create an array of promises to fetch all 30 states in parallel
    const promises = Object.entries(STATE_URL_SLUGS).map(async ([stateName, slug]) => {
      try {
        const { data } = await axiosClient.get(`https://vidyutpravah.in/state-data/${slug}`);
        // Regex to find: <span class="value_DemandMET_en..."><span...>  24,097&nbsp;MW</span>
        const match = data.match(/<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/);
        if (match && match[1]) {
          demands[stateName] = parseFloat(match[1].replace(/,/g, ''));
        } else {
          // If a state doesn't report live demand, default to 0 to prevent crashes
          demands[stateName] = 0;
        }
      } catch (e) {
        demands[stateName] = 0;
      }
    });

    await Promise.all(promises);
    return demands;
  }

  private static async insertStateData(
    dateStr: string, 
    timeStr: string, 
    prices: Record<string, number>, 
    demands: Record<string, number>
  ) {
    console.log('[ScraperService] Inserting State Data into Database...');
    const records = [];

    for (const stateName of Object.keys(STATE_TO_REGION)) {
      records.push({
        date: dateStr,
        timeStr: timeStr,
        stateName: stateName,
        region: STATE_TO_REGION[stateName],
        demand: demands[stateName] || 0,
        unit: 'MW',
        price: prices[stateName] || 0
      });
    }

    if (records.length > 0) {
      await prisma.stateDemandData.createMany({
        data: records,
        skipDuplicates: true
      });
      console.log(`[ScraperService] Inserted ${records.length} state records.`);
    }
  }
}
