const https = require('https');

https.get('https://www.iexindia.com/market-data/day-ahead-market/market-snapshot', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('HTML Length:', data.length);
    // Next.js injects data into scripts like self.__next_f
    // Let's look for signs of market data. 
    // Typical terms: 'purchaseBid', 'sellBid', or '00:00 - 00:15'
    
    const snippetIndex = data.indexOf('00:00 - 00:15');
    if (snippetIndex !== -1) {
      console.log('Found time block data!');
      console.log('Context:', data.substring(snippetIndex - 100, snippetIndex + 200));
    } else {
      console.log('Time block not found in initial HTML.');
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
