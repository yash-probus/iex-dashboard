import * as fs from 'fs';
import * as path from 'path';

const file = path.join(__dirname, '../src/modules/savings-calculator/savings-calculator.service.ts');
let content = fs.readFileSync(file, 'utf8');

// 1. applyElectricityDuty logic
content = content.replace(
  'const edRate = stateCharges ? Number(stateCharges.additionalCharge) || 0 : 0;',
  'const edRate = (stateCharges && entry.applyElectricityDuty) ? Number(stateCharges.additionalCharge) || 0 : 0;'
);

// 2. PROLT margin percentage logic
// Previously: const proltMarginCost = proltMargin * totalEnergyKwh;
// The user confirmed: "Percentage of Net Savings (e.g. 10% of total savings)"
content = content.replace(
  'const proltMarginCost = proltMargin * totalEnergyKwh;',
  'const proltMarginCost = (proltMargin / 100) * totalSavings;'
);

fs.writeFileSync(file, content);
console.log('patched service');
