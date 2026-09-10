import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorService } from '../modules/savings-calculator/savings-calculator.service';
import { SavingsCalculatorNewService } from '../modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function runTest() {
  console.log("Setting up tests in database...");

  try {
    // 1. Create Old Calculator Entry
    const oldEntry = await prisma.savingsCalculatorEntry.create({
      data: {
        clientName: 'TEST OLD',
        industryName: 'FLOUR MILL',
        address: 'Test Address',
        stateCode: 'UP',
        discom: 'DVVNL',
        consumerCategory: 'HV-2',
        voltageLevel: '11',
        billedDemandKv: 1000,
        sanctionedLoadKw: 1000,
        powerFactor: 0.99,
        proltMargin: 0,
        traderMargin: 0,
        todConsumptions: {
          "2025-08": {
            "05:00-10:00": 20000,
            "10:00-19:00": 50000,
            "19:00-03:00": 40000,
            "03:00-05:00": 10000
          }
        }
      }
    });
    console.log("Old Entry Created:", oldEntry.id);

    // 2. Create New Calculator Entry
    const newEntry = await prisma.savingsCalculatorNewEntry.create({
      data: {
        clientName: 'TEST NEW',
        industryName: 'FLOUR MILL',
        address: 'Test Address',
        stateCode: 'UP',
        discom: 'DVVNL',
        consumerCategory: 'HV-2',
        voltageLevel: '11',
        billedDemandKv: 1000,
        sanctionedLoadKw: 1000,
        powerFactor: 0.99,
        proltMargin: 0,
        traderMargin: 0,
        todConsumptions: {
          "2025-08": {
            "05:00-10:00": 20000,
            "10:00-19:00": 50000,
            "19:00-03:00": 40000,
            "03:00-05:00": 10000
          }
        },
        customSlots: [
          { startTime: '05:00', endTime: '10:00', effectivePrice: 0 },
          { startTime: '10:00', endTime: '19:00', effectivePrice: 0 },
          { startTime: '19:00', endTime: '03:00', effectivePrice: 0 },
          { startTime: '03:00', endTime: '05:00', effectivePrice: 0 }
        ]
      }
    });
    console.log("New Entry Created:", newEntry.id);

    console.log("\nCalculating Old Savings...");
    const oldResult = await SavingsCalculatorService.calculateSavings(oldEntry.id);
    const oldSummary = (oldResult as any).sortedMonthlyList ? (oldResult as any).sortedMonthlyList[0] : oldResult;
    
    console.log("Total Discom Cost:\t", oldSummary.totalBaselineCost);
    console.log("Total Savings:\t\t", oldSummary.totalSavings);

    console.log("\nCalculating New Savings...");
    const newResult = await SavingsCalculatorNewService.calculateSavings(newEntry.id);
    const newSummary = (newResult as any).sortedMonthlyList ? (newResult as any).sortedMonthlyList[0] : newResult;
    
    console.log("Total Discom Cost:\t", newSummary.totalBaselineCost);
    console.log("Total Savings:\t\t", newSummary.totalSavings);

    console.log("\nDifference in Savings:\t", Math.abs(oldSummary.totalSavings - newSummary.totalSavings));
    console.log("Difference in Discom Cost:\t", Math.abs(oldSummary.totalBaselineCost - newSummary.totalBaselineCost));

    // Cleanup
    await prisma.savingsCalculatorEntry.delete({ where: { id: oldEntry.id } });
    await prisma.savingsCalculatorNewEntry.delete({ where: { id: newEntry.id } });

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
