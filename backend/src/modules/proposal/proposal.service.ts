import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export class ProposalService {
  public async generateProposal(clientData: any, type: 'technical' | 'commercial' | 'default' = 'default'): Promise<Buffer> {
    let templateFilename = 'proposal_template.docx';
    if (type === 'technical') {
      templateFilename = 'technical_proposal_template.docx';
    } else if (type === 'commercial') {
      templateFilename = 'commercial_proposal_template.docx';
    }

    const templatePath = path.join(__dirname, '../../../assets/templates/', templateFilename);
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, 'binary');

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '<<', end: '>>' }
    });

    // Ignore errors if tags are missing in the document
    doc.setOptions({
        nullGetter() {
            return "";
        }
    });

    try {
        doc.render(clientData);
    } catch (error) {
        console.warn("Docxtemplater rendering error (likely missing tags):", error);
    }

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buf;
  }
}
