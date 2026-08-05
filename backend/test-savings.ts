import { PrismaClient } from "@prisma/client";
import { SavingsCalculatorService } from "./src/modules/savings-calculator/savings-calculator.service";

const prisma = new PrismaClient();

async function run() {
  try {
    const res = await SavingsCalculatorService.calculateSavings("fade3c79-434c-4faf-a5aa-5dd45edd1306");
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
