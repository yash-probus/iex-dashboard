import axios from 'axios';
import https from 'https';

async function test() {
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });
  const { data } = await axios.get('https://vidyutpravah.in/state-data/maharashtra', { httpsAgent });
  
  // print out parts of the HTML that contain MW
  const lines = data.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('MW')) {
      console.log(`Line ${i}:`, lines[i].trim());
    }
  }
}

test().catch(console.error);
