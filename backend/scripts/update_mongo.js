const mongoose = require('mongoose');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const TraderPerformanceSchema = new mongoose.Schema({
  todConsumptions: mongoose.Schema.Types.Mixed,
  clientName: String
}, { strict: false });
const TraderPerformance = mongoose.model('TraderPerformance', TraderPerformanceSchema, 'trader_performances');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/IEX_Dashboard');
  
  const docs = await TraderPerformance.find();
  if (docs.length === 0) {
    console.log("No Mongo docs found");
  } else {
    console.log("Found", docs.length, "Mongo docs. Using first one:", docs[0]._id, docs[0].clientName);
    const pdfFiles = fs.readdirSync(path.join(__dirname, '../../')).filter(f => f.endsWith('.pdf') && (f.startsWith('RTM_') || f.startsWith('DAM_') || f.startsWith('GDAM_')));
    const pdfPaths = pdfFiles.map(f => path.join(__dirname, '../../', f));
    
    if (pdfPaths.length > 0) {
      console.log(`Parsing ${pdfPaths.length} PDFs...`);
      const pythonPath = fs.existsSync(path.join(__dirname, '../../venv/bin/python')) 
        ? path.join(__dirname, '../../venv/bin/python') 
        : 'python3';
      const scriptPath = path.join(__dirname, 'parse_trade_report.py');
      const output = execSync(`${pythonPath} ${scriptPath} ${pdfPaths.join(' ')}`).toString();
      const parsedData = JSON.parse(output);
      
      let todConsumptions = docs[0].todConsumptions || {};
      if (!todConsumptions['2026-08']) {
        todConsumptions['2026-08'] = {};
      }
      todConsumptions['2026-08'].traderReports = parsedData;
      docs[0].todConsumptions = todConsumptions;
      docs[0].markModified('todConsumptions');
      await docs[0].save();
      console.log("Updated Mongo DB!");
    } else {
      console.log("No PDFs found");
    }
  }
  process.exit(0);
}
run();
