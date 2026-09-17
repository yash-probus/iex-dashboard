import { PrismaClient } from '@prisma/client';
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
    const entry = (entries as any)[0];
    
    // Simulate what the query does
    let stateName = entry.state_code;
    const rs = await prisma.regionState.findFirst({ where: { stateCode: stateName } });
    if (rs && rs.stateName) {
      stateName = rs.stateName;
    }
    const stateFormats = [stateName, stateName.toUpperCase(), stateName.toUpperCase().replace(/\s+/g, '_'), stateName.charAt(0).toUpperCase() + stateName.slice(1).toLowerCase()];
    
    let parsedCategory = entry.consumer_category;
    let parsedSubCategory = null;
    const startStr = '2025-08-01'; // hardcode a date for test
    const charges = await prisma.stateCharges.findFirst({
      where: {
        state: { in: stateFormats },
        discom: entry.discom === 'NPCL' ? 'NPCL' : null,
        category: parsedCategory,
      }
    });
    console.log("Found stateCharges for this state/discom?", charges);
    console.log("billedDemandKv:", entry.billed_demand_kv);
    console.log("sanctionedLoadKw:", entry.sanctioned_load_kw);
  }
}
main().finally(() => prisma.$disconnect());
