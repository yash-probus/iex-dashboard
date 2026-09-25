const fs = require('fs');
const files = [
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.service.ts',
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts',
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(/discomLandingPrice \* 0\.90 \* globalPf/g, "(entry.powerFactor ? discomLandingPrice * 0.90 * Number(entry.powerFactor) : discomLandingPrice * 0.90 * 0.99)");
  
  fs.writeFileSync(file, content);
}
console.log("Done");
