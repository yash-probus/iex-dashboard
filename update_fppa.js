const fs = require('fs');

const data = `Month,FPPA Charge %
202501,-2.33
202502,10
202503,-2.42
202504,1.24
202505,-2
202506,4.27
202507,1.97
202508,0.24
202509,2.34
202510,-1.63
202511,1.83
202512,5.56
202601,-2.33
202602,10
202603,-2.42
202604,-2.14
202605,-1.52
202606,10
202607,-4.43`;

const discoms = ['MVVNL', 'PVVNL', 'DVVNL', 'PuVVNL', 'KESCO'];
const lines = data.split('\n').slice(1);
let id = 1;
let csv = 'ID,State,Discom,Month,FPPA Charge %\n';

for (const line of lines) {
  const [month, charge] = line.split(',');
  for (const discom of discoms) {
    csv += `${id},Uttar Pradesh,${discom},${month},${charge}\n`;
    id++;
  }
}

fs.writeFileSync('fppa-charges.csv', csv);
console.log('Updated fppa-charges.csv');
