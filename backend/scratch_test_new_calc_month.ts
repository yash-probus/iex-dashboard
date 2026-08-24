import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function run() {
  const entries = await prisma.savingsCalculatorNewEntry.findMany({ take: 1, orderBy: { createdAt: 'desc' } });
  if (entries.length === 0) return;
  const entry = entries[0];
  console.log("Testing entry:", entry.id);

  try {
    const tod = entry.todConsumptions as Record<string, any>;
    const month = Object.keys(tod).find(k => k.includes('-'));
    if (!month) return;
    console.log("Month:", month);

    const res = await SavingsCalculatorNewService.calculateMarketDecision(entry.id, month);
    console.log("pureEnergyCost:", res.pureEnergyCost);
    console.log("totalBaselineCost:", res.totalBaselineCost);
    console.log("fullBaselineDiscomCost:", res.fullBaselineDiscomCost);
    console.log("totalEnergyKwh:", res.totalEnergyKwh);
    if (res.totalEnergyKwh > 0) {
        console.log("avgDiscomCost (totalBaselineCost / totalEnergyKwh):", res.totalBaselineCost / res.totalEnergyKwh);
        console.log("avgDiscomCost (pureEnergyCost / totalEnergyKwh):", res.pureEnergyCost / res.totalEnergyKwh);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
