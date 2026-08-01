const data = [
  [
    '01-07-2024', '1',
    '1',          '00:00-00:15',
    '5917.90',    '6894.50',
    '4571.89',    '4571.89',
    '3780.05'
  ],
  [
    '00:15-00:30',
    '5519.90',
    '6415.70',
    '4282.20',
    '4282.20',
    '3681.68'
  ],
  [
    '2',
    '00:30-00:45',
    '5112.10',
    '6411.30',
    '4027.68',
    '4027.68',
    '3500.63'
  ]
];

function parseNumber(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/,/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

let records = 0;
for (const row of data) {
  if (!row || row.length < 5) continue;
  const timeBlockIdx = row.findIndex((c: string) => c && c.includes(':') && c.includes('-'));
  if (timeBlockIdx === -1) continue;

  const timeBlock = row[timeBlockIdx];
  const [start] = timeBlock.split('-');
  if (!start) continue;
  const [hh, mm] = start.split(':').map(Number);
  const intervalNumber = (hh * 4) + (mm / 15) + 1;
  const offset = timeBlockIdx;
  
  console.log(`Parsed interval ${intervalNumber}:`, start.trim());
  records++;
}
console.log('Total parsed:', records);
