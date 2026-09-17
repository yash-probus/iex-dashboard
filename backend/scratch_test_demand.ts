import { PrismaClient } from '@prisma/client';
import { SavingsCalculatorNewService } from './src/modules/savings-calculator-new/savings-calculator-new.service';

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.$queryRawUnsafe(`
    SELECT *
    FROM "public"."savings_calculator_new_entries" 
    ORDER BY "created_at" DESC
    LIMIT 20
  `);
  
  if ((entries as any).length > 0) {
    for (const row of (entries as any)) {
      try {
        const result = await SavingsCalculatorNewService.calculateSavings(row.id, 'all');
        const months = (result as any).allMonthsData;
        if (months && months.length > 0) {
          console.log(`Checking Client: ${row.client_name}`);
          for (const m of months) {
            console.log(`Month: ${m.month}`);
            console.log(`  Demand Charge Rate: ${m.demandChargeRate}`);
            console.log(`  Peak Demand: ${m.peakDemand}`);
            console.log(`  Demand Charge: ${m.demandCharge}`);
            console.log(`  Demand And Fixed Applied: ${m.demandAndFixedChargesApplied}`);
            console.log(`  Electricity Duty: ${m.electricityDuty}`);
          }
        }
      } catch (e: any) {
      }
    }
  }
}
main().finally(() => prisma.$disconnect());
