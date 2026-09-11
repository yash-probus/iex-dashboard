import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';
import prisma from './src/config/prisma';

async function test() {
  const entries = await prisma.savingsCalculatorNewEntry.findMany();
  const target = entries[0];
  if (!target) return console.log("Not found");
  
  const id = target.id;
  const month = "2026-08"; // Change if target has different month

  console.log("Found target:", target.clientName);
  const insights = await SavingsCalculatorNewService.calculateDemandShiftInsights(id, month);
  let origSum = 0;
  let newSum = 0;
  insights.todShiftSummary.forEach((t: any) => {
    origSum += t.originalEnergy;
    newSum += t.newEnergy;
    console.log(t.tod, "Orig:", t.originalEnergy, "New:", t.newEnergy);
  });
  console.log("Total Orig:", origSum);
  console.log("Total New:", newSum);
}
test().catch(console.error).finally(() => process.exit(0));
