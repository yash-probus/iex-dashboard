const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const content = fs.readFileSync('assets/templates/technical_proposal_template.docx', 'binary');
const zip = new PizZip(content);

const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '<<', end: '>>' },
    nullGetter() { return ""; }
});

try {
    const text = doc.getFullText();
    console.log("Found <<monthlySavings>>?", text.includes('<<monthlySavings>>'));
    console.log("Found <<%monthly_savings_chart>>?", text.includes('<<%monthly_savings_chart>>'));
} catch (e) {
    console.error(e);
}
