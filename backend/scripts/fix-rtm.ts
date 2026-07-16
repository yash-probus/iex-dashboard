import * as fs from 'fs';

const filePath = '/Users/yashgupta/IEX-Dashboard/backend/src/modules/savings-calculator/savings-calculator.service.ts';
let code = fs.readFileSync(filePath, 'utf8');

const regex = /      };\n    \}\);\n\n    \/\/ ── Aggregate financials/g;

const replacement = `      };
    });

    // ── RTM Contiguity Optimization ──────────────
    for (let i = 0; i < slotsData.length; i++) {
      const slot = slotsData[i];
      if (slot.marketSource === 'RTM' && slot.shouldBuyFromMarket) {
        const prevSlot = i > 0 ? slotsData[i - 1] : null;
        const nextSlot = i < slotsData.length - 1 ? slotsData[i + 1] : null;

        const prevIsRTM = prevSlot?.marketSource === 'RTM' && prevSlot?.shouldBuyFromMarket;
        const nextIsRTM = nextSlot?.marketSource === 'RTM' && nextSlot?.shouldBuyFromMarket;

        if (!prevIsRTM && !nextIsRTM) {
          // Isolated RTM slot
          
          // Option 1: Downgrade this slot
          const altPrices = [slot.damLanding, slot.gdamLanding].filter(p => p !== null && p > 0) as number[];
          const bestAltLanding = altPrices.length > 0 ? Math.min(...altPrices) : slot.discomLanding;
          
          let downgradePenalty = Infinity;
          let newDowngradeSource = 'DAM';
          let newDowngradeShouldBuy = false;
          
          if (bestAltLanding < slot.discomLanding) {
            downgradePenalty = bestAltLanding - slot.rtmLanding;
            newDowngradeSource = bestAltLanding === slot.damLanding ? 'DAM' : 'GDAM';
            newDowngradeShouldBuy = true;
          } else {
            downgradePenalty = slot.discomLanding - slot.rtmLanding;
            newDowngradeSource = 'DAM';
            newDowngradeShouldBuy = false;
          }

          // Option 2: Upgrade prev slot
          let upgradePrevPenalty = Infinity;
          if (prevSlot && prevSlot.rtmLanding && prevSlot.rtmLanding > 0) {
            const currentCost = prevSlot.shouldBuyFromMarket ? prevSlot.bestMarketLanding : prevSlot.discomLanding;
            upgradePrevPenalty = prevSlot.rtmLanding - currentCost;
          }

          // Option 3: Upgrade next slot
          let upgradeNextPenalty = Infinity;
          if (nextSlot && nextSlot.rtmLanding && nextSlot.rtmLanding > 0) {
            const currentCost = nextSlot.shouldBuyFromMarket ? nextSlot.bestMarketLanding : nextSlot.discomLanding;
            upgradeNextPenalty = nextSlot.rtmLanding - currentCost;
          }

          const minPenalty = Math.min(downgradePenalty, upgradePrevPenalty, upgradeNextPenalty);

          if (minPenalty === downgradePenalty) {
            slot.marketSource = newDowngradeSource;
            slot.bestMarketLanding = newDowngradeShouldBuy ? bestAltLanding : 0;
            slot.shouldBuyFromMarket = newDowngradeShouldBuy;
            slot.savingsPerKwh = newDowngradeShouldBuy ? slot.discomLanding - bestAltLanding : 0;
          } else if (minPenalty === upgradePrevPenalty && prevSlot) {
            prevSlot.marketSource = 'RTM';
            prevSlot.bestMarketLanding = prevSlot.rtmLanding;
            prevSlot.shouldBuyFromMarket = true;
            prevSlot.savingsPerKwh = prevSlot.discomLanding - prevSlot.rtmLanding;
          } else if (minPenalty === upgradeNextPenalty && nextSlot) {
            nextSlot.marketSource = 'RTM';
            nextSlot.bestMarketLanding = nextSlot.rtmLanding;
            nextSlot.shouldBuyFromMarket = true;
            nextSlot.savingsPerKwh = nextSlot.discomLanding - nextSlot.rtmLanding;
          }
        }
      }
    }

    // ── Aggregate financials`;

code = code.replace(regex, replacement);

fs.writeFileSync(filePath, code);
console.log('RTM logic updated!');
