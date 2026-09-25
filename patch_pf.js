const fs = require('fs');

const files = [
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts',
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts',
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.service.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('powerFactor: Number(entry.powerFactor) || 0.99,')) {
    console.log(`Already patched ${file}`);
    continue;
  }
  
  content = content.replace(/peakDemand,\n\s*demandChargeRate,/g, 'peakDemand,\n      powerFactor: Number(entry.powerFactor) || 0.99,\n      demandChargeRate,');
  
  fs.writeFileSync(file, content);
  console.log(`Patched ${file}`);
}
