const axios = require('axios');
const https = require('https');

const STATE_URL_SLUGS = {
  'Andhra Pradesh': 'andhra-pradesh',
  'Maharashtra': 'maharashtra',
  'Delhi': 'delhi',
  'Gujarat': 'gujarat',
  'Karnataka': 'karnataka',
  'Tamil Nadu': 'tamil-nadu',
  'Uttar Pradesh': 'uttar-pradesh',
  'West Bengal': 'west-bengal',
  'Rajasthan': 'rajasthan',
  'Madhya Pradesh': 'madhya-pradesh'
};

const httpsAgent = new https.Agent({ rejectUnauthorized: false });
const axiosClient = axios.create({
  httpsAgent,
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  }
});

async function test() {
  const demands = {};
  const promises = Object.entries(STATE_URL_SLUGS).map(async ([stateName, slug]) => {
      try {
        const { data } = await axiosClient.get(`https://vidyutpravah.in/state-data/${slug}`);
        const match = data.match(/<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/);
        if (match && match[1]) {
          demands[stateName] = parseFloat(match[1].replace(/,/g, ''));
        } else {
          demands[stateName] = 0;
        }
      } catch (e) {
        console.error(`Error for ${stateName}: ${e.message}`);
        demands[stateName] = 0;
      }
    });

    await Promise.all(promises);
    console.log(demands);
}
test();
