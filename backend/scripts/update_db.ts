import mongoose from 'mongoose';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env') });

const TraderPerformanceSchema = new mongoose.Schema({
  todConsumptions: mongoose.Schema.Types.Mixed
}, { strict: false });
const TraderPerformance = mongoose.model('TraderPerformance', TraderPerformanceSchema, 'trader_performances');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/IEX_Dashboard');
  
  const pdfFiles = fs.readdirSync(path.join(__dirname, '../../')).filter(f => f.endsWith('.pdf'));
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
  const doc = await TraderPerformance.findById('66d1cf98f02f83c180da1d0d');
  if (doc) {
    let todConsumptions = doc.todConsumptions as any;
    if (!todConsumptions['2026-08']) {
      todConsumptions['2026-08'] = {};
    }
    todConsumptions['2026-08'].traderReports = parsedData;
    doc.markModified('todConsumptions');
    await doc.save();
    console.log("DB updated successfully!");
  } else {
    console.log("Document not found!");
  }
  
  process.exit(0);
}
run();
