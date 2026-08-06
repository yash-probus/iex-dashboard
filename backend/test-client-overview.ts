import { PrismaClient } from "@prisma/client";
import { SavingsCalculatorService } from "./src/modules/savings-calculator/savings-calculator.service";

const prisma = new PrismaClient();

async function run() {
  try {
    const res = await SavingsCalculatorService.getClientOverview("fade3c79-434c-4faf-a5aa-5dd45edd1306");
    console.log("Total Savings:", res.totalSavings);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
