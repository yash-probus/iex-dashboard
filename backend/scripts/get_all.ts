import { TraderPerformanceService } from './src/modules/trader-performance/trader-performance.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const entries = await prisma.traderPerformanceEntry.findMany();
  console.log("Prisma:", entries.length);
  const m = await (require('mongoose')).model('TraderPerformance', new (require('mongoose')).Schema({}, {strict: false}), 'trader_performances').find();
  console.log("Mongoose:", m.length);
  m.forEach((doc: any) => console.log(doc._id, doc.clientName));
  process.exit(0);
}
run();
