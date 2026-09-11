const fs = require('fs');
const content = fs.readFileSync('backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts', 'utf8');
console.log(content.includes('currentConsumedMarketEnergy -= remainingToRemove'));
