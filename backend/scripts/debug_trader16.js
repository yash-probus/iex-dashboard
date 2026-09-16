const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const entry = await prisma.traderPerformanceEntry.findUnique({
    where: { id: '66d1cf98f02f83c180da1d0d' }
  });
  console.log("pocLoss:", entry.pocLoss);
  console.log("stuLoss:", entry.stuLoss);
  console.log("discom:", entry.discom);
  process.exit(0);
}
run();
