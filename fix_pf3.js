const fs = require('fs');
const files = [
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.service.ts',
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts',
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Verify getFlooredMaxEnergyPerSlot
  if (!content.includes('powerFactor: any = 0.99')) {
    console.error(`Failed to find updated function signature in ${file}`);
  }
}
console.log("Check complete");
