import re

file_path = '/Users/yashgupta/IEX-Dashboard/backend/src/modules/trader-performance/trader-performance.service.ts'

with open(file_path, 'r') as f:
    content = f.read()

# For calculateMarketDecisionAllMonths
content = content.replace(
    "let totalConsumerBusEnergyKwh = 0;",
    "let totalConsumerBusEnergyKwh = 0;\n    let totalTraderMarketEnergy = 0;\n    let totalTraderLandedCost = 0;"
)

content = content.replace(
    "totalConsumerBusEnergyKwh += (res as any).totalConsumerBusEnergyKwh || res.totalMarketEnergyKwh;",
    "totalConsumerBusEnergyKwh += (res as any).totalConsumerBusEnergyKwh || res.totalMarketEnergyKwh;\n          totalTraderMarketEnergy += (res as any).totalTraderMarketEnergy || 0;\n          totalTraderLandedCost += (res as any).totalTraderLandedCost || 0;"
)

content = content.replace(
    "totalConsumerBusEnergyKwh,\n      totalBaselineCost,",
    "totalConsumerBusEnergyKwh,\n      totalTraderMarketEnergy,\n      totalTraderLandedCost,\n      totalBaselineCost,"
)


# For calculateSavingsAllMonths
# Wait, calculateSavingsAllMonths does NOT return totalTraderMarketEnergy... Oh, actually I injected it manually in calculateMarketDecisionAllMonths. Let me just write it carefully.

with open(file_path, 'w') as f:
    f.write(content)

print("Aggregated!")
