import { PrismaClient } from '@prisma/client';
import { TraderPerformanceActualService } from './src/modules/trader-performance-actual/trader-performance-actual.service';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.$queryRawUnsafe(`
    SELECT *
    FROM "public"."savings_calculator_new_entries" 
    WHERE "client_name" ILIKE '%Ankit%'
    ORDER BY "created_at" DESC
    LIMIT 1
  `);
  
  if ((entries as any).length > 0) {
    const row = (entries as any)[0];
    console.log(`Checking Client: ${row.client_name}`);
    try {
      const result = await SavingsCalculatorNewService.calculateSavings(row.id, 'all');
      const months = (result as any).allMonthsData;
      if (months && months.length > 0) {
        for (const m of months) {
          console.log(`Month: ${m.month}`);
          console.log(`  Demand Charge Rate: ${m.demandChargeRate}`);
          console.log(`  Peak Demand: ${m.peakDemand}`);
          console.log(`  Demand Charge: ${m.demandCharge}`);
          console.log(`  Electricity Duty: ${m.electricityDuty}`);
        }
      } else {
        console.log("No months data found.");
      }
    } catch (e: any) {
      console.log(`Error: ${e.message}`);
    }
  }
}
main().finally(() => prisma.$disconnect());
