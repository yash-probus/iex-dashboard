import * as xlsx from 'xlsx';

const wb = xlsx.readFile('/Users/yashgupta/IEX-Dashboard/RTM_Market Snapshot.xlsx');
console.log('Sheet Names:', wb.SheetNames);
for (const name of wb.SheetNames) {
  const data = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
  console.log(`Sheet "${name}" has ${data.length} rows.`);
}
