import { PrismaClient } from '@prisma/client';
import { TraderPerformanceActualService } from './src/modules/trader-performance-actual/trader-performance-actual.service';

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.$queryRawUnsafe(`
    SELECT *
    FROM "public"."savings_calculator_new_entries" 
    ORDER BY "created_at" DESC
    LIMIT 3
  `);
  
  if ((entries as any).length > 0) {
    for (const row of entries as any) {
      console.log(`Checking Client: ${row.client_name}`);
      try {
        const result = await TraderPerformanceActualService.calculateSavings(row.id, 'all');
        const months = (result as any).allMonthsData;
        if (months && months.length > 0) {
          const m = months[0];
          console.log(`Month: ${m.month}`);
          console.log(`Demand Charge Rate: ${m.demandChargeRate}`);
          console.log(`Peak Demand: ${m.peakDemand}`);
          console.log(`Demand Charge: ${m.demandCharge}`);
          console.log(`Electricity Duty: ${m.electricityDuty}`);
        } else {
          console.log("No months data found.");
        }
      } catch (e: any) {
        console.log(`Error: ${e.message}`);
      }
      console.log('---');
    }
  }
}
main().finally(() => prisma.$disconnect());
