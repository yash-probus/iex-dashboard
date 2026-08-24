import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const d = await prisma.damRecord.findFirst({
    where: { mcp: { gt: 0 } }
  });
  console.log("DamRecord MCP:", d?.mcp);
  process.exit(0);
}

run().catch(console.error);
