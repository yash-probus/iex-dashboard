const fs = require('fs');
const traderReports = JSON.parse(fs.readFileSync('backend/parsed_pdfs.json'));

const traderTradesLookup = {};
if (traderReports && traderReports.data) {
  for (const [key, report] of Object.entries(traderReports.data)) {
    const rawDate = report.delivery_date || key;
    if (rawDate && report.trades && Array.isArray(report.trades)) {
      let dDate = null;
      if (rawDate.length === 10 && rawDate.charAt(2) === '-' && rawDate.charAt(5) === '-') {
        const parts = rawDate.split('-');
        dDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        try {
          dDate = new Date(rawDate).toISOString().split('T')[0];
        } catch (e) {
          dDate = rawDate;
        }
      }
      console.log(`Parsed date ${rawDate} to ${dDate}`);
      
      if (dDate) {
        if (!traderTradesLookup[dDate]) traderTradesLookup[dDate] = {};
        
        report.trades.forEach(trade => {
          trade.oa_market_type = report.oa_market_type || 'RTM';
          if (trade.period && typeof trade.period === 'string') {
            const startStr = trade.period.split('-')[0].trim();
            const parts = startStr.split(':');
            if (parts.length === 2) {
              const hour = parseInt(parts[0], 10);
              const min = parseInt(parts[1], 10);
              const tb = hour * 4 + (min / 15) + 1;
              if (!traderTradesLookup[dDate][tb]) {
                traderTradesLookup[dDate][tb] = [];
              }
              traderTradesLookup[dDate][tb].push(trade);
            }
          }
        });
      }
    }
  }
}
console.log(`Keys in traderTradesLookup:`, Object.keys(traderTradesLookup));
