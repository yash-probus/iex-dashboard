import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import { ChartGeneratorService } from './chartGenerator.service';

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
    
    // Generate the chart image buffer if monthlyData is present
    if (clientData.monthlyData && clientData.monthlyData.length > 0) {
      clientData.monthly_savings_chart = await ChartGeneratorService.generateSavingsChart(
          clientData.monthlyData,
          clientData.monthlySavings || '0'
      );
    }
    
    const imageOptions = {
        centered: false,
        getImage: (tagValue: any) => {
            return tagValue;
        },
        getSize: (img: any, tagValue: any, tagName: string) => {
            // Keep the exact same size as the static image in the template
            return [600, 300]; 
        }
    };
    
    const imageModule = new ImageModule(imageOptions);

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
