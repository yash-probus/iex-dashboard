import { PrismaClient } from '@prisma/client';
import { TraderPerformanceActualService } from './src/modules/trader-performance-actual/trader-performance-actual.service';

const prisma = new PrismaClient();

async function main() {
  const entries = await prisma.$queryRawUnsafe(`
    SELECT *
    FROM "public"."savings_calculator_new_entries" 
    WHERE "client_name" ILIKE '%Ankit%'
    ORDER BY "created_at" DESC
    LIMIT 1
  `);
  console.log("Entry:", entries);
  if ((entries as any).length > 0) {
    const entryId = (entries as any)[0].id;
    console.log("Found ID:", entryId);
    
    // Call the actual calculation
    const result = await TraderPerformanceActualService.calculateSavings(entryId);
    
    console.log("Total Baseline Cost:", (result as any).totalBaselineCost);
    console.log("Electricity Duty:", (result as any).electricityDuty);
    console.log("Electricity Duty After OA:", (result as any).electricityDutyAfterOA);
  }
}
main().finally(() => prisma.$disconnect());
