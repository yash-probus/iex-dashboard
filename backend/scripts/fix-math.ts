import * as fs from 'fs';

const filePath = '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts';
let code = fs.readFileSync(filePath, 'utf8');

// FIX 1: Loss Application in calcExchangeLanding
const calcRegex = /      const calcExchangeLanding = \(\(mcp: number \| null\) => \{[\s\S]*?        if \(mcp == null\) return null;[\s\S]*?        const base = mcp \+ ctuCharge \+ stuCharge \+ wheelingCharge \+ OTHER_CHARGES \+ EXCHANGE_FEES \+ GST_EXCHANGE \+ TRADER_MARGIN \+ GST_TRADER_MARGIN \+ crossSubsidy \+ additionalSurcharge;[\s\S]*?        const lossMultiplier = 1 \+ \(istsLoss \/ 100\) \+ \(stuLoss \/ 100\) \+ \(wheelingLoss \/ 100\);[\s\S]*?        return base \* lossMultiplier;[\s\S]*?      \}\);/g;

const calcReplacement = `      const calcExchangeLanding = (mcp: number | null) => {
        if (mcp == null) return null;
        // Losses apply to energy drops, meaning we divide the MCP by (1 - loss_fraction)
        const lossCoefficient = (1 - (istsLoss / 100)) * (1 - (stuLoss / 100)) * (1 - (wheelingLoss / 100));
        const lossAdjustedMcp = mcp / lossCoefficient;
        
        // Surcharges are flat values on the final delivered units, so they are added AFTER grid losses
        return lossAdjustedMcp + ctuCharge + stuCharge + wheelingCharge + OTHER_CHARGES + EXCHANGE_FEES + GST_EXCHANGE + TRADER_MARGIN + GST_TRADER_MARGIN + crossSubsidy + additionalSurcharge;
      };`;
      
code = code.replace(calcRegex, calcReplacement);


// FIX 2: Double Counting ED in calculateMarketDecision
// First, add let totalElectricityDuty = 0; near totalBaselineCost = 0;
const varsRegex = /    let totalBaselineCost = 0;[\s\S]*?    let totalLandedExchangeCost = 0;[\s\S]*?    let totalEnergyKwh = 0;[\s\S]*?    let totalMarketEnergyKwh = 0;/g;
const varsReplacement = `    let totalBaselineCost = 0;
    let totalElectricityDuty = 0;
    let totalLandedExchangeCost = 0;
    let totalEnergyKwh = 0;
    let totalMarketEnergyKwh = 0;`;
code = code.replace(varsRegex, varsReplacement);

// Second, accumulate totalElectricityDuty inside the loop
const loopRegex = /      const slabED = slabEnergyBill \* 0\.075;[\s\S]*?      \/\/ Baseline: all consumption at DISCOM rate \(inclusive of fixed\/taxes\)/g;
const loopReplacement = `      const slabED = slabEnergyBill * 0.075;
      totalElectricityDuty += slabED;

      // Baseline: all consumption at DISCOM rate (inclusive of fixed/taxes)`;
code = code.replace(loopRegex, loopReplacement);

// Third, replace the electricityDuty calculation at the end
const finalRegex = /    const totalSavings = totalBaselineCost - totalLandedExchangeCost;[\s\S]*?    const electricityDuty = totalBaselineCost \* 0\.075;[\s\S]*?    return \{/g;
const finalReplacement = `    const totalSavings = totalBaselineCost - totalLandedExchangeCost;

    return {`;
code = code.replace(finalRegex, finalReplacement);

// And replace electricityDuty in the return object with totalElectricityDuty
const returnObjRegex = /      demandCharge,[\s\S]*?      electricityDuty,[\s\S]*?      todSummaries,/g;
const returnObjReplacement = `      demandCharge,
      electricityDuty: totalElectricityDuty,
      todSummaries,`;
code = code.replace(returnObjRegex, returnObjReplacement);


fs.writeFileSync(filePath, code);
console.log('Math logic updated!');
