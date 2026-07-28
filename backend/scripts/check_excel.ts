import * as XLSX from 'xlsx';

const filePath = '/Users/yashgupta/IEX-Dashboard/GDAM_Market Snapshot.xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Row 2:', jsonData[2]);
console.log('Row 3:', jsonData[3]);
console.log('Row 4:', jsonData[4]);
console.log('Row 5:', jsonData[5]);
