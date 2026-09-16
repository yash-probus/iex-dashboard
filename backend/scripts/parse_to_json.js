const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const pdfFiles = fs.readdirSync(path.join(__dirname, '../../')).filter(f => f.endsWith('.pdf') && (f.startsWith('RTM_') || f.startsWith('DAM_') || f.startsWith('GDAM_')));
const pdfPaths = pdfFiles.map(f => path.join(__dirname, '../../', f));
if (pdfPaths.length > 0) {
  const pythonPath = fs.existsSync(path.join(__dirname, '../../venv/bin/python')) 
    ? path.join(__dirname, '../../venv/bin/python') 
    : 'python3';
  const scriptPath = path.join(__dirname, 'parse_trade_report.py');
  const output = execSync(`${pythonPath} ${scriptPath} ${pdfPaths.join(' ')}`).toString();
  fs.writeFileSync('parsed_pdfs.json', output);
  console.log("Saved parsed_pdfs.json");
}
