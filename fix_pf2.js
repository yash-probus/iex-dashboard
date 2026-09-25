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
    /export function getFlooredMaxEnergyPerSlot\(sanctionedLoadKw: any, powerFactor: any = 0\.99\): number \{\n\s*const pf = Number\(powerFactor\) \|\| 0\.99;\n\s*const load = \(sanctionedLoadKw && typeof sanctionedLoadKw\.toNumber === 'function'\)\s*\n\s*\? sanctionedLoadKw\.toNumber\(\)\s*\n\s*: \(Number\(sanctionedLoadKw\) \|\| 0\);\n\s*if \(load <= 0\) return 0;\n\s*\/\/ The frontend already passes sanctionedLoadKw as \(kVA \* 0\.9\), so we just convert to MW\.\n\s*const rawMw = load \/ 1000;/m,
    `export function getFlooredMaxEnergyPerSlot(sanctionedLoadKw: any, powerFactor: any = 0.99): number {
  const load = (sanctionedLoadKw && typeof sanctionedLoadKw.toNumber === 'function')
    ? sanctionedLoadKw.toNumber()
    : (Number(sanctionedLoadKw) || 0);
  if (load <= 0) return 0;
  
  const pf = Number(powerFactor) || 0.99;
  const loadKva = load / pf;
  const rawMw = (loadKva * 0.9) / 1000;`
  );
  
  // also handle the case where sed messed it up
  content = content.replace(
    /export function getFlooredMaxEnergyPerSlot\(sanctionedLoadKw: any, powerFactor: any = 0\.99\): number \{\n\s*const pf = Number\(powerFactor\) \|\| 0\.99;\n\s*const load = \(sanctionedLoadKw && typeof sanctionedLoadKw\.toNumber === 'function'\) \n    \? sanctionedLoadKw\.toNumber\(\) \n    : \(Number\(sanctionedLoadKw\) \|\| 0\);\n  if \(load <= 0\) return 0;\n  \/\/ The frontend already passes sanctionedLoadKw as \(kVA \* 0\.9\), so we just convert to MW\.\n  const rawMw = load \/ 1000;/m,
    `export function getFlooredMaxEnergyPerSlot(sanctionedLoadKw: any, powerFactor: any = 0.99): number {
  const load = (sanctionedLoadKw && typeof sanctionedLoadKw.toNumber === 'function') 
    ? sanctionedLoadKw.toNumber() 
    : (Number(sanctionedLoadKw) || 0);
  if (load <= 0) return 0;
  
  const pf = Number(powerFactor) || 0.99;
  const loadKva = load / pf;
  const rawMw = (loadKva * 0.9) / 1000;`
  );
  
  // Clean up globalPf usages inside NPCL logic
  content = content.replace(/discomLandingPrice \* 0\.90 \* 0\.99/g, "discomLandingPrice * 0.90 * globalPf");
  content = content.replace(/dc \* 0\.90 \* 0\.99/g, "dc * 0.90 * globalPf");
  
  fs.writeFileSync(file, content);
}
console.log("Done");
