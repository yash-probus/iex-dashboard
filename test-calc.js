const fs = require('fs');
const tsConfig = require('./backend/tsconfig.json');
require('ts-node').register(tsConfig);
const { SavingsCalculatorNewService } = require('./backend/src/modules/savings-calculator-new/savings-calculator-new.service');

async function test() {
  const entries = await SavingsCalculatorNewService.getAll();
  const target = entries.find(e => e.clientName === 'Al Ammar Frozen Foods');
  if (!target) return console.log("Not found");
  
  const res = await SavingsCalculatorNewService.calculateMarketDecisionAllMonths(target.id, undefined, true);
  console.log("Total Baseline Cost:", res.totalBaselineCost);
  console.log("Total Consumer Bus Energy KWh:", res.totalConsumerBusEnergyKwh);
}
test().catch(console.error);
