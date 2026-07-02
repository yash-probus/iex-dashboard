import axios from 'axios';
import https from 'https';
import fs from 'fs';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function run() {
  const { data } = await axios.get('https://vidyutpravah.in/state-data/maharashtra', { httpsAgent });
  const match = data.match(/<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/);
  console.log('Maharashtra Demand:', match ? match[1] : 'Not found');
  fs.writeFileSync('scratch_vp_maharashtra.html', data);
  console.log('Saved to scratch_vp_maharashtra.html');
}
run();
