import { PrismaClient } from "@prisma/client";
import { SavingsCalculatorService } from "./src/modules/savings-calculator/savings-calculator.service";

const prisma = new PrismaClient();

async function run() {
  try {
    const res = await SavingsCalculatorService.calculateSavingsAllMonths("6f8931eb-378a-490b-a213-0546504ad486");
    console.log("Total Savings:", res.totalSavings);
    console.log("Total Baseline:", res.totalBaselineCost);
    console.log("Total Energy:", res.totalEnergyKwh);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
