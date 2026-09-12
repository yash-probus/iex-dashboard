import re

file_path = '/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.service.ts'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Inject lookup dictionary
lookup_code = """
    const monthConsumptions = (entry.todConsumptions as Record<string, Record<string, number | string>> | null)?.[monthKey] || {};

    const traderReports = (monthConsumptions as any).traderReports || { data: {} };
    const traderTradesLookup: Record<string, Record<number, any>> = {};
    if (traderReports && traderReports.data) {
      Object.values(traderReports.data).forEach((report: any) => {
        if (report.delivery_date && report.trades && Array.isArray(report.trades)) {
          const dDate = new Date(report.delivery_date).toISOString().split('T')[0];
          if (!traderTradesLookup[dDate]) traderTradesLookup[dDate] = {};
          
          report.trades.forEach((trade: any) => {
            if (trade.period && typeof trade.period === 'string') {
              const startStr = trade.period.split('-')[0].trim();
              const parts = startStr.split(':');
              if (parts.length === 2) {
                const hour = parseInt(parts[0], 10);
                const min = parseInt(parts[1], 10);
                const tb = hour * 4 + (min / 15) + 1;
                traderTradesLookup[dDate][tb] = trade;
              }
            }
          });
        }
      });
    }
"""
if "traderTradesLookup:" not in content:
    content = content.replace(
        "const monthConsumptions = (entry.todConsumptions as Record<string, Record<string, number | string>> | null)?.[monthKey] || {};",
        lookup_code
    )

# 2. Add global trader variables
global_vars = """
    let preTotalEnergyKwh = 0;
    
    let totalTraderMarketEnergy = 0;
    let totalTraderLandedCost = 0;
"""
if "let totalTraderMarketEnergy = 0;" not in content:
    content = content.replace("let preTotalEnergyKwh = 0;", global_vars)


# 3. Inside the loop, find exactMarketEnergyCost assignment
# We need to compute trader's exact cost
trader_cost_code = """
        (s as any).exactMarketEnergyCost = exactMarketEnergyCost;

        // --- TRADER EXACT COST CONTINUOUS CALCULATION ---
        const dDateStr = new Date(s.date).toISOString().split('T')[0];
        const tTrade = traderTradesLookup[dDateStr]?.[s.timeblock];
        if (tTrade) {
          const tMarketEnergy = (tTrade.qty_mw || 0) * 0.25 * 1000;
          const tRawCost = Math.abs(tTrade.amount || 0);
          const tExchangeLandingRate = tMarketEnergy > 0 ? (tRawCost / tMarketEnergy) : 0;
          
          // Same exact state charges applied to Probus landing cost:
          const tNonExchangeSurcharges = stuCharge + wheelingCharge + additionalSurcharge;
          const tLossAdjusted = (tExchangeLandingRate + tNonExchangeSurcharges) / lossCoefficient;
          const tLandedCostKwh = tLossAdjusted + cssCharge;
          
          const tExactCost = tLandedCostKwh * tMarketEnergy;
          
          totalTraderMarketEnergy += tMarketEnergy;
          totalTraderLandedCost += tExactCost;
          
          (s as any).traderMarketEnergy = tMarketEnergy;
          (s as any).traderExactCost = tExactCost;
        } else {
          (s as any).traderMarketEnergy = 0;
          (s as any).traderExactCost = 0;
        }
"""

content = content.replace("(s as any).exactMarketEnergyCost = exactMarketEnergyCost;", trader_cost_code)

# 4. Expose the totals in the final return object
if "totalTraderMarketEnergy:" not in content:
    content = content.replace(
        "totalConsumerBusEnergyKwh,",
        "totalConsumerBusEnergyKwh,\n      totalTraderMarketEnergy,\n      totalTraderLandedCost,"
    )


with open(file_path, 'w') as f:
    f.write(content)

print("Patched completely!")
