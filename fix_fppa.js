const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const data = [
  { month: 202501, val: -2.33 },
  { month: 202502, val: 10 },
  { month: 202503, val: -2.42 },
  { month: 202504, val: 1.24 },
  { month: 202505, val: -2 },
  { month: 202506, val: 4.27 },
  { month: 202507, val: 1.97 },
  { month: 202508, val: 0.24 },
  { month: 202509, val: 2.34 },
  { month: 202510, val: -1.63 },
  { month: 202511, val: 1.83 },
  { month: 202512, val: 5.56 },
  { month: 202601, val: -2.33 },
  { month: 202602, val: 10 },
  { month: 202603, val: -2.42 },
  { month: 202604, val: -2.14 },
  { month: 202605, val: -1.52 },
  { month: 202606, val: 10 },
  { month: 202607, val: -4.43 }
];
async function run() {
  let updated = 0;
  for (const d of data) {
    try {
      await prisma.fppaCharges.upsert({
        where: { state_month: { state: 'UTTAR PRADESH', month: d.month } },
        update: { fppaChargePercent: d.val },
        create: { state: 'UTTAR PRADESH', month: d.month, fppaChargePercent: d.val }
      });
      updated++;
    } catch(e) {
      console.error(e.message);
    }
  }
  console.log(`Updated ${updated} records!`);
}
run();
