const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace ED calculation in calculateSavingsHV2
  // We need to inject the extraction of global ED settings
  const target1 = `    let monthsToProcess = Object.entries(todConsumptions).filter(([ym]) => /^\\d{4}-\\d{2}$/.test(ym));`;
  
  if (content.includes(target1) && !content.includes('let globalApplyED = entry.applyElectricityDuty')) {
    const replacement1 = `    let monthsToProcess = Object.entries(todConsumptions).filter(([ym]) => /^\\d{4}-\\d{2}$/.test(ym));

    let globalApplyED = entry.applyElectricityDuty !== false;
    let globalEDPercent = 7.5;
    if (todConsumptions._meta && (todConsumptions._meta as any).electricityDutyPercent !== undefined) {
      globalEDPercent = Number((todConsumptions._meta as any).electricityDutyPercent) || 7.5;
    } else if (entry.electricityDutyPercent !== undefined) {
      globalEDPercent = Number(entry.electricityDutyPercent) || 7.5;
    }`;
    content = content.replace(target1, replacement1);
  }

  // Replace the inner loop calculation
  const target2 = `      const edKey = Object.keys(monthConsumptions).find(k => k.toLowerCase() === 'electricity duty');
      let applyED = true;
      if (edKey && monthConsumptions[edKey] !== undefined && monthConsumptions[edKey] !== null) {
        applyED = String(monthConsumptions[edKey]).trim().toLowerCase() !== 'no';
      }

      const edRate = 0.075;
      const slabED = applyED ? discountedSlabBill * edRate : 0;`;

  if (content.includes(target2)) {
    const replacement2 = `      const edKey = Object.keys(monthConsumptions).find(k => k.toLowerCase() === 'electricity duty' || k.toLowerCase() === 'apply electricity duty');
      let applyED = globalApplyED;
      if (edKey && monthConsumptions[edKey] !== undefined && monthConsumptions[edKey] !== null) {
        applyED = String(monthConsumptions[edKey]).trim().toLowerCase() !== 'no' && String(monthConsumptions[edKey]).trim().toLowerCase() !== 'false';
      }

      const edRate = globalEDPercent / 100;
      const slabED = applyED ? discountedSlabBill * edRate : 0;`;
    content = content.replace(target2, replacement2);
  }
  
  // Replace ED After OA as well
  const target3 = `      const slabEDAfterOA = applyED ? discountedProltBill * edRate : 0;`;
  if (content.includes(target3) && content.includes(target2)) {
      // It uses the same applyED and edRate variables that we just modified, so target3 is fine as is!
      // But we should make sure it actually uses edRate
  }

  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Patched ' + filepath);
}

patchFile('/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance-actual/trader-performance-actual.service.ts');
patchFile('/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts');

