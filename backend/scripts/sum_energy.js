const fs = require('fs');
const data = JSON.parse(fs.readFileSync('parsed_pdfs.json'));
let energy = 0;
let cost = 0;
for (const date in data.data) {
  energy += data.data[date].total_trade_mwh * 1000;
  cost += Math.abs(data.data[date].total_amount);
}
console.log("Total Trader Energy (kWh):", energy);
console.log("Total Trader Cost (raw PDF amount Rs):", cost);
