const axios = require('axios');

async function testScrape() {
  try {
    const response = await axios.get('https://www.iexindia.com/market-data/day-ahead-market/market-snapshot', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const html = response.data;
    const matches = html.match(/self\.__next_f\.push\(\[1,"(.*?)"]\)/g);
    if (matches) {
      console.log(`Found ${matches.length} chunks`);
      matches.slice(0, 5).forEach(m => console.log(m.substring(0, 150)));
    }
  } catch (error) {
    console.error(error.message);
  }
}
testScrape();
