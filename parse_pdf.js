const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('Rajeev_Jaiswal_Energy_Savings_Report_Redesigned.pdf');
pdf(dataBuffer).then(function(data) {
    console.log(data.text.substring(0, 1500));
});
