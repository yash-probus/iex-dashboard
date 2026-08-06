import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

export class ProposalService {
  public async generateProposal(clientData: any): Promise<Buffer> {
    const templatePath = path.join(__dirname, '../../../assets/templates/proposal_template.docx');
    
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

    doc.render(clientData);

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buf;
  }
}
