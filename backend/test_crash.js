const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');

const content = fs.readFileSync('assets/templates/technical_proposal_template.docx', 'binary');
const zip = new PizZip(content);

const imageModule = new ImageModule({
    centered: false,
    getImage(tagValue, tagName) {
        if (!tagValue) return false;
        return tagValue;
    },
    getSize(img, tagValue, tagName) {
        return [500, 300];
    }
});

const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '<<', end: '>>' },
    modules: [imageModule],
    nullGetter() {
        return "";
    }
});

try {
    doc.render({});
    console.log("Render succeeded!");
} catch (error) {
    console.error("Render crashed:", error.message);
    if (error.properties) console.error(error.properties);
}
