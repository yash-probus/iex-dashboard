import axios from 'axios';
import https from 'https';
import { PrismaClient } from '@prisma/client';
import { ApiLogService } from '../modules/api-log/api-log.service';

const prisma = new PrismaClient();

// Create an https agent that bypasses SSL verification for government portals
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const axiosClient = axios.create({
  httpsAgent,
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  }
});

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


  // ==========================================
  // NPP All-India Demand (Real Time Demand Met)
  // ==========================================
  public static async getNppDemandData(dateStr: string) {
    try {
      // The NPP API returns JSON for a specific date: YYYY-MM-DD
      const response = await axiosClient.get(`https://npp.gov.in/dashBoard/demandmet1chartdata?date=${dateStr}`);
      const data = response.data;
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Get the latest reading (last element in the array)
      const latestReading = data[data.length - 1];
      
      if (!latestReading || !latestReading.value_of_data) {
        return null;
      }
      
      const demandMet = Number(latestReading.value_of_data);
      const d = new Date(latestReading.updated_on);
      
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const timeStr = formatter.format(d);

      const result = {
        date: dateStr,
        timeStr: timeStr,
        demandMet,
        dataUpdatedAt: d.toISOString(),
      };
      
      await ApiLogService.createLog('NPP Demand API', `https://npp.gov.in/dashBoard/demandmet1chartdata?date=${dateStr}`, 'SUCCESS', `Fetched demand data for ${dateStr}`);
      return result;
    } catch (error: any) {
      console.error(`Error scraping NPP demand for ${dateStr}:`, error.message);
      await ApiLogService.createLog('NPP Demand API', `https://npp.gov.in/dashBoard/demandmet1chartdata?date=${dateStr}`, 'ERROR', error.message);
      return null;
    }
  }

  public static async getNppGenerationData(dateStr: string) {
    try {
      const response = await axiosClient.get(`https://npp.gov.in/dashBoard/demandmet2chartdata?date=${dateStr}`);
      const data = response.data;
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Group by updated_on
      const generationByTime: Record<number, any> = {};
      
      data.forEach((item: any) => {
        if (!generationByTime[item.updated_on]) {
          generationByTime[item.updated_on] = {
            thermal: 0, gas: 0, nuclear: 0, hydro: 0, wind: 0, solar: 0
          };
        }
        
        const name = item.name_of_data.toUpperCase();
        const value = Number(item.value_of_data) || 0;
        
        if (name.includes('THERMAL')) generationByTime[item.updated_on].thermal = value;
        else if (name.includes('GAS')) generationByTime[item.updated_on].gas = value;
        else if (name.includes('NUCLEAR')) generationByTime[item.updated_on].nuclear = value;
        else if (name.includes('HYDRO')) generationByTime[item.updated_on].hydro = value;
        else if (name.includes('WIND')) generationByTime[item.updated_on].wind = value;
        else if (name.includes('SOLAR')) generationByTime[item.updated_on].solar = value;
      });
      
      // Get the latest reading
      const timestamps = Object.keys(generationByTime).map(Number).sort((a, b) => a - b);
      const latestTimestamp = timestamps[timestamps.length - 1];
      const latestData = generationByTime[latestTimestamp];
      
      const d = new Date(latestTimestamp);
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const timeStr = formatter.format(d);

      const result = {
        date: dateStr,
        timeStr: timeStr,
        thermal: latestData.thermal,
        gas: latestData.gas,
        nuclear: latestData.nuclear,
        hydro: latestData.hydro,
        wind: latestData.wind,
        solar: latestData.solar,
        dataUpdatedAt: d.toISOString(),
      };

      await ApiLogService.createLog('NPP Generation API', `https://npp.gov.in/dashBoard/demandmet2chartdata?date=${dateStr}`, 'SUCCESS', `Fetched generation data for ${dateStr}`);
      return result;
    } catch (error: any) {
      console.error(`Error scraping NPP generation for ${dateStr}:`, error.message);
      await ApiLogService.createLog('NPP Generation API', `https://npp.gov.in/dashBoard/demandmet2chartdata?date=${dateStr}`, 'ERROR', error.message);
      return null;
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
