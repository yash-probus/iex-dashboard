const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const fs = require('fs');

const zip = new PizZip(fs.readFileSync('assets/templates/technical_proposal_template.docx', 'binary'));

const imageModule = new ImageModule({
    centered: false,
    getImage(tagValue, tagName) {
        console.log("getImage called with tagName:", tagName);
        return false;
    },
    getSize() {
        return [100, 100];
    }
});

const doc = new Docxtemplater(zip, {
    modules: [imageModule]
});

doc.render({ monthly_savings_chart: Buffer.from("test") });
