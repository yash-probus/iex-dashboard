const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { TraderPerformanceService } = require('../dist/modules/trader-performance/trader-performance.service.js');

async function run() {
  const id = '66d1cf98f02f83c180da1d0d';
  const serviceCode = fs.readFileSync(path.join(__dirname, '../dist/modules/trader-performance/trader-performance.service.js'), 'utf8');
  
  let modified = serviceCode.replace('traderTradesLookup[dDate][tb].push(trade);', 
    'traderTradesLookup[dDate][tb].push(trade); console.log("Added trade to", dDate, tb, trade.qty_mw);');
    
  fs.writeFileSync(path.join(__dirname, '../dist/modules/trader-performance/trader-performance.service.temp.js'), modified);
  
  const tempService = require('../dist/modules/trader-performance/trader-performance.service.temp.js').TraderPerformanceService;
  const result = await tempService.calculateMarketDecision(id, '2026-08', undefined);
  
  process.exit(0);
}
run();
