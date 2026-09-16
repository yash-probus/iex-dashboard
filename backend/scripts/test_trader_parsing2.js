const fs = require('fs');
const traderReports = JSON.parse(fs.readFileSync('backend/parsed_pdfs.json'));
let totalEnergy = 0;
for (const [key, report] of Object.entries(traderReports.data)) {
  let rawDate = report.delivery_date || key;
  let dDate = null;
  if (rawDate.length === 10 && rawDate.charAt(2) === '-' && rawDate.charAt(5) === '-') {
    const parts = rawDate.split('-');
    dDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
  } else {
    try {
      const d = new Date(rawDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dDate = `${year}-${month}-${day}`;
    } catch (e) {
      dDate = rawDate;
    }
  }
  console.log(`Parsed ${rawDate} to ${dDate}`);
}
