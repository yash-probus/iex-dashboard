const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const id = '66d1cf98f02f83c180da1d0d';
  const serviceCode = fs.readFileSync(path.join(__dirname, '../dist/modules/trader-performance/trader-performance.service.js'), 'utf8');
  
  let modified = serviceCode.replace('let trades = traderTradesLookup[checkDate]?.[s.timeblock];', 
    `let trades = traderTradesLookup[checkDate]?.[s.timeblock];
     if (checkDate === '2026-08-31' && s.timeblock === 49) {
       console.log("DEBUG 2026-08-31 49!");
       console.log("traderTradesLookup keys:", Object.keys(traderTradesLookup));
       console.log("traderTradesLookup[checkDate] keys:", Object.keys(traderTradesLookup[checkDate] || {}));
       console.log("trades:", trades);
     }
    `);
    
  fs.writeFileSync(path.join(__dirname, '../dist/modules/trader-performance/trader-performance.service.temp.js'), modified);
  
  const tempService = require('../dist/modules/trader-performance/trader-performance.service.temp.js').TraderPerformanceService;
  const result = await tempService.calculateMarketDecision(id, '2026-08', undefined);
  
  process.exit(0);
}
run();
