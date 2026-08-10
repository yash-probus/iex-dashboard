import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:iex_sec_k9P2mX_2026@13.206.77.155:5436/Prolt_Operations' } }
});
async function main() {
  console.log('Creating indexes...');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "DamRecord_datasetId_idx" ON "DamRecord"("datasetId");');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "RtmRecord_datasetId_idx" ON "RtmRecord"("datasetId");');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "GdamRecord_datasetId_idx" ON "GdamRecord"("datasetId");');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "GdamNewRecord_datasetId_idx" ON "GdamNewRecord"("datasetId");');
  
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Dataset_market_status_deliveryDate_idx" ON "Dataset"("market", "status", "deliveryDate");');
  console.log('Indexes created successfully.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
