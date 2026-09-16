const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  const pdfFiles = fs.readdirSync(path.join(__dirname, '../../')).filter(f => f.endsWith('.pdf') && (f.startsWith('RTM_') || f.startsWith('DAM_') || f.startsWith('GDAM_')));
  const pdfPaths = pdfFiles.map(f => path.join(__dirname, '../../', f));
  
  if (pdfPaths.length === 0) {
    console.log("No PDFs found.");
    process.exit(0);
  }
  
  console.log(`Parsing ${pdfPaths.length} PDFs...`);
  const pythonPath = fs.existsSync(path.join(__dirname, '../../venv/bin/python')) 
    ? path.join(__dirname, '../../venv/bin/python') 
    : 'python3';
  
  const scriptPath = path.join(__dirname, 'parse_trade_report.py');
  
  const output = execSync(`${pythonPath} ${scriptPath} ${pdfPaths.join(' ')}`).toString();
  const parsedData = JSON.parse(output);
  
  console.log("Parsed data, updating DB...");
  const entries = await prisma.traderPerformanceEntry.findMany({
    orderBy: { clientName: 'asc' },
    take: 1
  });
  
  if (entries.length > 0) {
    const doc = entries[0];
    console.log("Updating document:", doc.id, doc.clientName);
    
    let todConsumptions = doc.todConsumptions || {};
    if (!todConsumptions['2026-08']) {
      todConsumptions['2026-08'] = {};
    }
    todConsumptions['2026-08'].traderReports = parsedData;
    
    await prisma.traderPerformanceEntry.update({
      where: { id: doc.id },
      data: { todConsumptions }
    });
    
    console.log("DB updated successfully!");
  } else {
    console.log("Document not found!");
  }
  
  process.exit(0);
}
run().catch(console.error);
