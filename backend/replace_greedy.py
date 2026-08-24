import sys

with open('src/modules/savings-calculator-new/savings-calculator-new.service.ts', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '// Calculate Discom baseline cost and allocate energy across TOD windows (Formula: sanctionedLoad * 0.25)' in line:
        start_idx = i
    if 'aggregatedTotals.iexFee += slotMarketEnergyKwh * 0.02;' in line and start_idx != -1:
        end_idx = i + 2
        break

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end index")
    sys.exit(1)

replacement = """      // Calculate Discom baseline cost and allocate energy across TOD windows (Greedy Chronological Banking Algorithm)

      for (const customSlot of customSlots) {
        const slotEnergyTotal = customSlot.consumptionKwh;
        const slotDiscomPrice = Number(customSlot.effectivePrice) > 0 ? Number(customSlot.effectivePrice) : 8.5;
        const slotName = customSlot.name || `${customSlot.startTime}-${customSlot.endTime}`;
        
        // Filter 15-minute timeblocks belonging to this custom TOD slot
        const slotBlocks = monthlySlots.filter(s => s.customSlotId === customSlot.id || s.todSlab === slotName);
        if (slotBlocks.length === 0) continue;

        // Sort chronologically
        slotBlocks.sort((a, b) => a.date.localeCompare(b.date) || a.timeblock - b.timeblock);
        
        const requiredEnergyPerSlot = slotEnergyTotal / slotBlocks.length;
        
        // Initialize requirements
        slotBlocks.forEach(sb => {
          sb.requiredEnergy = requiredEnergyPerSlot;
          sb.bankedEnergy = 0;
          sb.purchasedEnergy = 0;
          sb.marketEnergy = 0;
          sb.discomEnergy = 0;
          sb.marketCost = 0;
          sb.discomCost = 0;
          sb.baselineCost = requiredEnergyPerSlot * slotDiscomPrice;
        });

        // Sort by cheapest price for greedy buying
        const cheapToExpensive = [...slotBlocks].sort((a, b) => a.comparedLowestPrice - b.comparedLowestPrice);

        for (const buyerSlot of cheapToExpensive) {
           let availableCapacity = defaultMaxEnergyPerSlot - buyerSlot.purchasedEnergy;
           if (availableCapacity <= 0) continue;

           const buyerIndex = slotBlocks.indexOf(buyerSlot);

           // Forward Banking
           for (let i = buyerIndex; i < slotBlocks.length; i++) {
              const targetSlot = slotBlocks[i];
              const unmetRequirement = targetSlot.requiredEnergy - targetSlot.bankedEnergy - targetSlot.purchasedEnergy;
              
              if (unmetRequirement > 0) {
                  const amountToBuy = Math.min(availableCapacity, unmetRequirement);
                  if (amountToBuy > 0) {
                      buyerSlot.purchasedEnergy += amountToBuy;
                      availableCapacity -= amountToBuy;
                      
                      if (i === buyerIndex) {
                         targetSlot.purchasedEnergy += amountToBuy;
                      } else {
                         targetSlot.bankedEnergy += amountToBuy;
                      }
                      
                      const cost = amountToBuy * buyerSlot.comparedLowestPrice;
                      
                      if (buyerSlot.selectedSource !== 'DISCOM' && buyerSlot.comparedLowestPrice > 0) {
                          targetSlot.marketEnergy += amountToBuy;
                          targetSlot.marketCost += cost;
                      } else {
                          targetSlot.discomEnergy += amountToBuy;
                          targetSlot.discomCost += cost;
                      }
                  }
              }
              if (availableCapacity <= 0) break;
           }
        }

        // Unfulfilled Fallback & Aggregation
        let slotConsumptionKwh = 0;
        let slotMarketEnergyKwh = 0;
        let slotDiscomEnergyKwh = 0;
        let slotBaselineCost = 0;
        let slotMarketCost = 0;
        let slotDiscomCost = 0;

        slotBlocks.forEach(sb => {
           const unmet = sb.requiredEnergy - sb.bankedEnergy - sb.purchasedEnergy;
           if (unmet > 0) {
              sb.purchasedEnergy += unmet;
              const cost = unmet * sb.comparedLowestPrice;
              if (sb.selectedSource !== 'DISCOM' && sb.comparedLowestPrice > 0) {
                 sb.marketEnergy += unmet;
                 sb.marketCost += cost;
              } else {
                 sb.discomEnergy += unmet;
                 sb.discomCost += cost;
              }
           }
           
           sb.maxEnergyPerSlot = sb.requiredEnergy; // For compatibility with older reporting functions
           sb.optimizedCost = sb.marketCost + sb.discomCost;
           
           totalBaselineCost += sb.baselineCost;
           totalEnergyKwh += sb.requiredEnergy;
           totalMarketEnergyKwh += sb.marketEnergy;
           totalLandedExchangeCost += sb.marketCost;
           totalDiscomAfterProlt += sb.discomCost;

           slotConsumptionKwh += sb.requiredEnergy;
           slotMarketEnergyKwh += sb.marketEnergy;
           slotDiscomEnergyKwh += sb.discomEnergy;
           slotBaselineCost += sb.baselineCost;
           slotMarketCost += sb.marketCost;
           slotDiscomCost += sb.discomCost;
        });

        todSummaries.push({
          month: yearMonth,
          slotName: slotName,
          slabName: slotName,
          startTime: customSlot.startTime,
          endTime: customSlot.endTime,
          consumptionKwh: slotConsumptionKwh,
          totalEnergyKwh: slotConsumptionKwh,
          effectivePrice: slotDiscomPrice,
          baselineCost: slotBaselineCost,
          discomBill: slotBaselineCost,
          marketEnergyKwh: slotMarketEnergyKwh,
          oaUnits: slotMarketEnergyKwh,
          consumerBusUnits: slotMarketEnergyKwh,
          discomUnits: slotConsumptionKwh,
          marketCostBase: slotMarketCost,
          oaBill: slotMarketCost,
          proltDiscomBill: slotDiscomCost,
          savings: Math.max(0, slotBaselineCost - (slotMarketCost + slotDiscomCost))
        });

        aggregatedTotals.cssRate = cssRate;
        aggregatedTotals.cssCharge += slotMarketEnergyKwh * cssRate;
        aggregatedTotals.rpoCharge += slotMarketEnergyKwh * 0.25;
        aggregatedTotals.pocCharge += slotMarketEnergyKwh * ctuCharge;
        aggregatedTotals.stuCharge += slotMarketEnergyKwh * stuCharge;
        aggregatedTotals.dcCharge += slotMarketEnergyKwh * wheelingCharge;
        aggregatedTotals.iexFee += slotMarketEnergyKwh * 0.02;
      }
"""

lines = lines[:start_idx] + [replacement] + lines[end_idx:]

with open('src/modules/savings-calculator-new/savings-calculator-new.service.ts', 'w') as f:
    f.writelines(lines)

print("Replacement successful")
