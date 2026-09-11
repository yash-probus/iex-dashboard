import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';
import prisma from './src/config/prisma';

async function run() {
  const entries = await prisma.savingsCalculatorNewEntry.findMany({
    where: { clientName: { contains: 'Al Ammar' } }
  });
  if (!entries.length) return console.log("Not found");
  const id = entries[0].id;
  const month = "2026-08";
  const res = await SavingsCalculatorNewService.calculateMarketDecision(id, month, undefined, false);
  
  let slabSum = 0;
  res.oaDetailed.breakdown.forEach((b: any) => {
    slabSum += b.discomUnits;
  });
  console.log("Original breakdown discomUnits sum:", slabSum);

  let sSum = 0;
  res.slotsData.forEach((s: any) => {
    sSum += (s.consumedMarketEnergy || 0) + (s.discomEnergy || 0);
  });
  console.log("Original slotsData consumed+discom sum:", sSum);

  const insights = await SavingsCalculatorNewService.calculateDemandShiftInsights(id, month);
  let newEnergySum = 0;
  insights.todShiftSummary.forEach((t: any) => {
    newEnergySum += t.newEnergy;
  });
  console.log("Insights newEnergy sum:", newEnergySum);
}
run().catch(console.error).finally(() => process.exit(0));
