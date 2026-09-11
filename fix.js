const fs = require('fs');

function applyFix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 1: Properly track consumedMarketEnergy and lossMultiplier in shiftableSlots
  const shiftableSlotsRegex = /const shiftableSlots = slotsData\.map\(\(s: any, index: number\) => \{([\s\S]*?)return \{([\s\S]*?)tod: s\.tod\n\s*\};\n\s*\}\);/;
  const shiftableSlotsReplacement = `const shiftableSlots = slotsData.map((s: any, index: number) => {
      const costPerKwh = s.shouldBuyFromMarket ? s.bestMarketLanding : s.discomLanding;
      const originalMarketEnergy = s.marketEnergy || 0;
      const originalConsumedMarketEnergy = s.consumedMarketEnergy || 0;
      const originalDiscomEnergy = s.discomEnergy || 0;
      const currentEnergy = originalConsumedMarketEnergy + originalDiscomEnergy;
      
      const lossMultiplier = originalMarketEnergy > 0 
        ? (originalConsumedMarketEnergy / originalMarketEnergy) 
        : 0.90; // Default fallback if no market energy bought
        
      const regionalHeadroom = Math.max(0, maxEnergyPerSlot - originalMarketEnergy);
      const headroom = regionalHeadroom * lossMultiplier;
      originalTotalCost += (currentEnergy * costPerKwh);

      return {
        originalIndex: index,
        costPerKwh,
        currentEnergy,
        originalEnergy: currentEnergy,
        currentMarketEnergy: originalMarketEnergy,
        originalMarketEnergy,
        currentConsumedMarketEnergy: originalConsumedMarketEnergy,
        originalConsumedMarketEnergy,
        currentDiscomEnergy: originalDiscomEnergy,
        shouldBuyFromMarket: s.shouldBuyFromMarket,
        headroom,
        lossMultiplier,
        date: s.date,
        timeblock: s.timeblock,
        tod: s.tod
      };
    });`;
  content = content.replace(shiftableSlotsRegex, shiftableSlotsReplacement);

  // Fix 2: Properly shift using consumedMarketEnergy and lossMultiplier
  const shiftLogicRegex = /expSlot\.currentEnergy -= amountToShift;\n\s*if \(expSlot\.currentDiscomEnergy >= amountToShift\) \{([\s\S]*?)\} else \{\n\s*const remainingToRemove = amountToShift - expSlot\.currentDiscomEnergy;\n\s*expSlot\.currentDiscomEnergy = 0;\n\s*expSlot\.currentMarketEnergy -= remainingToRemove;\n\s*\}\n\n\s*cheapSlot\.headroom -= amountToShift;\n\s*cheapSlot\.currentEnergy \+= amountToShift;\n\s*\/\/ Add energy to the cheap slot using its cheapest available source \(determined by shouldBuyFromMarket\)\n\s*if \(cheapSlot\.shouldBuyFromMarket\) \{\n\s*cheapSlot\.currentMarketEnergy \+= amountToShift;\n\s*\} else \{\n\s*cheapSlot\.currentDiscomEnergy \+= amountToShift;\n\s*\}/;
  
  const shiftLogicReplacement = `expSlot.currentEnergy -= amountToShift;
      if (expSlot.currentDiscomEnergy >= amountToShift) {
        expSlot.currentDiscomEnergy -= amountToShift;
      } else {
        const remainingToRemove = amountToShift - expSlot.currentDiscomEnergy;
        expSlot.currentDiscomEnergy = 0;
        expSlot.currentConsumedMarketEnergy -= remainingToRemove;
        expSlot.currentMarketEnergy -= (remainingToRemove / expSlot.lossMultiplier);
      }

      cheapSlot.headroom -= amountToShift;
      cheapSlot.currentEnergy += amountToShift;
      if (cheapSlot.shouldBuyFromMarket) {
        cheapSlot.currentConsumedMarketEnergy += amountToShift;
        cheapSlot.currentMarketEnergy += (amountToShift / cheapSlot.lossMultiplier);
      } else {
        cheapSlot.currentDiscomEnergy += amountToShift;
      }`;
  content = content.replace(shiftLogicRegex, shiftLogicReplacement);

  // Fix 3: Return the correctly tracked variables at the end
  const shiftableSlotsReturnRegex = /shiftableSlots\.map\(\(s: any\) => \(\{\n\s*index: s\.originalIndex,[\s\S]*?discomEnergy: s\.currentDiscomEnergy\n\s*\}\)\)/;
  const shiftableSlotsReturnReplacement = `shiftableSlots.map((s: any) => ({
      index: s.originalIndex,
      date: s.date,
      timeblock: s.timeblock,
      tod: s.tod,
      costPerKwh: s.costPerKwh,
      originalEnergy: s.originalEnergy,
      currentEnergy: s.currentEnergy,
      marketEnergy: s.currentMarketEnergy,
      consumedMarketEnergy: s.currentConsumedMarketEnergy,
      discomEnergy: s.currentDiscomEnergy
    }))`;
  content = content.replace(shiftableSlotsReturnRegex, shiftableSlotsReturnReplacement);

  // Fix 4: Correct assignment in calculateMarketDecision when useShiftedProfile is true
  const assignmentRegex = /\(s as any\)\.marketEnergy = shiftSlot\.marketEnergy \|\| 0;\n\s*\(s as any\)\.consumedMarketEnergy = shiftSlot\.marketEnergy \|\| 0;/g;
  const assignmentReplacement = `(s as any).marketEnergy = shiftSlot.marketEnergy || 0;\n            (s as any).consumedMarketEnergy = shiftSlot.consumedMarketEnergy || 0;`;
  content = content.replace(assignmentRegex, assignmentReplacement);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Patched ${filePath}`);
}

applyFix('./backend/src/modules/savings-calculator-new/savings-calculator-new.service.ts');
applyFix('./backend/src/modules/savings-calculator/savings-calculator.service.ts');
