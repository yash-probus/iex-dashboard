import axios from 'axios';
import https from 'https';

const STATE_URL_SLUGS = {
  'Jammu & Kashmir': 'jammu-kashmir',
  'Himachal Pradesh': 'himachal-pradesh',
  'Punjab': 'punjab',
  'Haryana': 'haryana',
  'Uttarakhand': 'uttarakhand',
  'Delhi': 'delhi',
  'Uttar Pradesh': 'uttar-pradesh',
  'Maharashtra': 'maharashtra'
};

async function test() {
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  const axiosClient = axios.create({ httpsAgent });

  for (const [state, slug] of Object.entries(STATE_URL_SLUGS)) {
    try {
      const { data } = await axiosClient.get(`https://vidyutpravah.in/state-data/${slug}`);
      const match = data.match(/<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/);
      console.log(`[${state}] Demand: ${match ? match[1] : 'NOT FOUND'}`);
      
      if (!match) {
        const fallback = data.match(/value_DemandMET_en[^>]*>(.*?)<\/span>/);
        console.log(`  Fallback match: ${fallback ? fallback[1] : 'None'}`);
      }
    } catch (e: any) {
      console.error(`[${state}] Error: ${e.message}`);
    }
  }
}

test().catch(console.error);
