import axios from 'axios';
import https from 'https';

async function test() {
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  try {
    const { data } = await axios.get('https://vidyutpravah.in/state-data/punjab', { httpsAgent });
    const regex = /<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/;
    const match = data.match(regex);
    console.log("Punjab Demand:", match ? match[1] : 'Not Found');
  } catch (e: any) {
    console.error("Punjab Error:", e.message);
  }
}

test().catch(console.error);
