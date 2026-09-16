const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const entries = await prisma.savingCalculatorEntry.findMany({
    select: { id: true, clientName: true, discom: true, stateCode: true }
  });
  console.log(entries);
  process.exit(0);
}
run();
