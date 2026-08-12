const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const content = fs.readFileSync('assets/templates/technical_proposal_template.docx', 'binary');
const zip = new PizZip(content);

const imageOptions = {
    centered: false,
    getImage: () => Buffer.from('', 'base64'), // Empty buffer!
    getSize: () => [100, 100]
};
const imageModule = new ImageModule(imageOptions);

const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '<<', end: '>>' },
    modules: [imageModule],
    nullGetter() { return ""; }
});

try {
    doc.render({
        clientName: 'Test',
        monthly_savings_chart: Buffer.from('', 'base64'),
        dashboard_screenshot: Buffer.from('', 'base64')
    });
    console.log("Render successful!");
} catch (error) {
    console.log("Render failed:", error);
}
