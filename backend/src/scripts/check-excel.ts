import * as xlsx from 'xlsx';

const workbook = xlsx.readFile('/Users/yashgupta/IEX-Dashboard/GDAM_Market Snapshot (1).xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

console.log("First 15 rows:");
for (let i = 0; i < 15; i++) {
  console.log(data[i]);
}
