import * as fs from 'fs';

const filePath = '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Add preTotalEnergyKwh calculation before the slotsByTod loop
const preTotalInjection = `
    let preTotalEnergyKwh = 0;
    Object.keys(slotsByTod).forEach(groupKey => {
      const matchedKey = Object.keys(monthConsumptions).find(k => {
        if (k.toLowerCase().includes('peak demand') || k.toLowerCase().includes('sanctioned')) return false;
        return k.toUpperCase().includes(groupKey) || k.toUpperCase() === groupKey;
      });
      if (matchedKey && monthConsumptions[matchedKey] !== undefined && monthConsumptions[matchedKey] !== '') {
        preTotalEnergyKwh += Number(monthConsumptions[matchedKey]);
      }
    });

    Object.keys(slotsByTod).forEach(groupKey => {`;
code = code.replace("    Object.keys(slotsByTod).forEach(groupKey => {", preTotalInjection);

// Modify the calculation inside the loop
const calculationRegex = /      \/\/ Baseline: all consumption at DISCOM rate[\s\S]*?      totalBaselineCost \+= slabConsumption \* slabDiscomRate;[\s\S]*?      \/\/ Exchange cost: market portion at market price \+ DISCOM portion at DISCOM price[\s\S]*?      totalLandedExchangeCost \+= \(marketEnergy \* avgMarketPrice\) \+ \(discomEnergy \* slabDiscomRate\);[\s\S]*?      totalEnergyKwh \+= slabConsumption;[\s\S]*?      totalMarketEnergyKwh \+= marketEnergy;[\s\S]*?      todSummaries\.push\(\{[\s\S]*?        slabName: groupKey,[\s\S]*?        totalEnergyKwh: slabConsumption,[\s\S]*?        marketEnergyKwh: marketEnergy,[\s\S]*?        marketCostBase: marketEnergy \* avgMarketPrice[\s\S]*?      \}\);[\s\S]*?      \/\/ --- OA Detailed Simulation Breakdowns ---[\s\S]*?      const discomBill = slabConsumption \* slabDiscomRate;[\s\S]*?      const proltDiscomBill = \(slabConsumption - marketEnergy\) \* slabDiscomRate;/g;

const replacement = `      // Calculate ED and Prorated Demand Charge for this slab
      const slabFraction = preTotalEnergyKwh > 0 ? slabConsumption / preTotalEnergyKwh : 0;
      const slabDemandCharge = demandCharge * slabFraction;
      const slabEnergyBill = slabConsumption * slabDiscomRate;
      const slabED = slabEnergyBill * 0.075;

      // Baseline: all consumption at DISCOM rate (inclusive of fixed/taxes)
      const slabTotalDiscomBill = slabEnergyBill + slabDemandCharge + slabED;
      totalBaselineCost += slabTotalDiscomBill;

      // Prolt Discom Bill is the DISCOM bill for the un-switched units + 100% of the fixed/taxes
      const proltEnergyBill = discomEnergy * slabDiscomRate;
      // ED applies to total consumption physical units (same as baseline), demand charge is also fixed.
      const proltDiscomBillTotal = proltEnergyBill + slabDemandCharge + slabED;

      // Exchange cost: market portion at market price + Prolt DISCOM Bill
      totalLandedExchangeCost += (marketEnergy * avgMarketPrice) + proltDiscomBillTotal;

      totalEnergyKwh += slabConsumption;
      totalMarketEnergyKwh += marketEnergy;

      todSummaries.push({
        slabName: groupKey,
        totalEnergyKwh: slabConsumption,
        marketEnergyKwh: marketEnergy,
        marketCostBase: marketEnergy * avgMarketPrice
      });

      // --- OA Detailed Simulation Breakdowns ---
      const discomBill = slabTotalDiscomBill;
      const proltDiscomBill = proltDiscomBillTotal;`;

code = code.replace(calculationRegex, replacement);

fs.writeFileSync(filePath, code);
console.log('Backend code updated!');
