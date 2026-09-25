const fs = require('fs');
const files = [
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.service.ts',
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts',
  '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix getFlooredMaxEnergyPerSlot function signature and logic
  content = content.replace(
    /export function getFlooredMaxEnergyPerSlot\(sanctionedLoadKw: any\): number \{\s*const pf = Number\(powerFactor\) \|\| 0\.99;\s*const load =/,
    `export function getFlooredMaxEnergyPerSlot(sanctionedLoadKw: any, powerFactor: any = 0.99): number {
  const pf = Number(powerFactor) || 0.99;
  const load =`
  );

  content = content.replace(
    /\/\/ The frontend already passes sanctionedLoadKw as \(kVA \* 0\.9\), so we just convert to MW\.\s*const rawMw = load \/ 1000;/,
    `const loadKva = load / pf;
  const rawMw = (loadKva * 0.9) / 1000;`
  );

  // Update getFlooredMaxEnergyPerSlot calls to pass powerFactor
  content = content.replace(/getFlooredMaxEnergyPerSlot\(entry\.sanctionedLoadKw\)/g, "getFlooredMaxEnergyPerSlot(entry.sanctionedLoadKw, entry.powerFactor)");
  content = content.replace(/getFlooredMaxEnergyPerSlot\(sanctionedLoadKw \? Number\(sanctionedLoadKw\) : 100\)/g, "getFlooredMaxEnergyPerSlot(sanctionedLoadKw ? Number(sanctionedLoadKw) : 100, entry.powerFactor)");
  content = content.replace(/getFlooredMaxEnergyPerSlot\(entry\.sanctionedLoadKw \? Number\(entry\.sanctionedLoadKw\) : 100\)/g, "getFlooredMaxEnergyPerSlot(entry.sanctionedLoadKw ? Number(entry.sanctionedLoadKw) : 100, entry.powerFactor)");
  content = content.replace(/getFlooredMaxEnergyPerSlot\(sanctionedLoad\)/g, "getFlooredMaxEnergyPerSlot(sanctionedLoad, entry.powerFactor)");
  content = content.replace(/getFlooredMaxEnergyPerSlot\(sanctionedLoadKw\)/g, "getFlooredMaxEnergyPerSlot(sanctionedLoadKw, entry.powerFactor)");
  
  // Also fix NPCL 0.99 multipliers
  content = content.replace(/discomLandingPrice \* 0\.90 \* 0\.99/g, "discomLandingPrice * 0.90 * pf");
  content = content.replace(/dc \* 0\.90 \* 0\.99/g, "dc * 0.90 * pf");
  content = content.replace(/dc \* 0\.90 \* globalPf/g, "dc * 0.90 * globalPf"); // already ok if globalPf
  content = content.replace(/const pf = /g, "const pf = "); // just to be safe it doesn't break if already there

  // Ensure pf is defined before NPCL usages if it's not
  // Actually, we can just replace 0.99 with globalPf if we are inside the calculateMarketDecision method
  content = content.replace(/discomLandingPrice \* 0\.90 \* 0\.99/g, "discomLandingPrice * 0.90 * globalPf");
  content = content.replace(/dc \* 0\.90 \* 0\.99/g, "dc * 0.90 * globalPf");
  
  fs.writeFileSync(file, content);
}
console.log("Done");
