const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const content = fs.readFileSync('assets/templates/technical_proposal_template.docx', 'binary');
const zip = new PizZip(content);

// 1x1 transparent PNG buffer
const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 'base64');

const imageOptions = {
    centered: false,
    getImage: () => pngBuffer,
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
        monthlyData: [ { month_name: "Jan" } ],
        monthly_savings_chart: true,
        dashboard_screenshot: true
    });
    console.log("Render successful!");
} catch (error) {
    console.log("Render failed:");
    console.log(error);
}
