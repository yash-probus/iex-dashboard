import axios from 'axios';

async function run() {
  const { data } = await axios.get('https://vidyutpravah.in/state-data/maharashtra');
  const match = data.match(/<span class="value_DemandMET_en[^>]*><span[^>]*>\s*([\d,]+)\s*&nbsp;MW<\/span>/);
  console.log('Maharashtra Demand:', match ? match[1] : 'Not found');
}
run();
