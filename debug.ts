import { SavingsCalculatorNewService } from './backend/src/modules/savings-calculator-new/savings-calculator-new.service';

async function run() {
  const entries = await SavingsCalculatorNewService.getAll();
  const target = entries.find(e => e.clientName === 'Al Ammar Frozen Foods');
  if (!target) {
    console.log("Not found");
    return;
  }
  const id = target.id;
  const month = "2026-08"; // Aug-26

  const res = await SavingsCalculatorNewService.calculateMarketDecision(id, month, undefined, false);
  let totalOrig = 0;
  res.slotsData.forEach((s: any) => {
    totalOrig += (s.consumedMarketEnergy || 0) + (s.discomEnergy || 0);
  });
  console.log("Total Consumer Energy in slotsData:", totalOrig);
  console.log("Total Baseline Cost:", res.totalBaselineCost);
  
  let slabConsumptionSum = 0;
  res.oaDetailed.breakdown.forEach((b: any) => {
    slabConsumptionSum += b.discomUnits;
  });
  console.log("Sum of discomUnits in breakdown:", slabConsumptionSum);

  const insights = await SavingsCalculatorNewService.calculateDemandShiftInsights(id, month);
  let newEnergySum = 0;
  insights.todShiftSummary.forEach((t: any) => {
    newEnergySum += t.newEnergy;
  });
  console.log("Sum of newEnergy in shiftInsights:", newEnergySum);
}
run().catch(console.error);
