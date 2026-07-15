import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      'SELECT DISTINCT timestamp, time_block, predicted_mcp FROM forecasting.dam_forecasting WHERE timestamp::date = \'2026-07-15\'::date ORDER BY time_block ASC LIMIT 20'
    );
    console.log("DB Rows length:", rows.length);
    for (const r of rows) {
      console.log(`Timestamp: ${r.timestamp}, Block: ${r.time_block}, Predicted MCP: ${r.predicted_mcp}`);
    }
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
