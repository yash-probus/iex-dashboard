import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
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
          clientData.monthlySavings || '0',
          clientData.savings_in_words || 'Twenty Five'
      );
    }

    // Generate consumption mix chart
    if (clientData.oaPercentage !== undefined && clientData.discomPercentage !== undefined) {
      clientData.consumption_mix_chart = await ChartGeneratorService.generateConsumptionMixChart(
          clientData.oaPercentage,
          clientData.discomPercentage,
          clientData.oaUnits || 0,
          clientData.discomUnits || 0
      );
    }

    // Generate spend comparison chart
    if (clientData.actualSpend !== undefined && clientData.optimizedSpend !== undefined) {
      clientData.spend_comparison_chart = await ChartGeneratorService.generateSpendComparisonChart(
          clientData.actualSpend,
          clientData.optimizedSpend,
          clientData.monthLabel || 'Current Month'
      );
    }

    // Generate daily savings chart
    if (clientData.dailyData && clientData.dailyData.length > 0) {
      clientData.daily_savings_chart = await ChartGeneratorService.generateDailySavingsChart(
          clientData.dailyData,
          clientData.monthLabel || 'Current Month'
      );
    }

    // Generate purchase comparison chart
    if (clientData.recommendedOaPercentage !== undefined && clientData.recommendedDiscomPercentage !== undefined) {
      clientData.purchase_comparison_chart = await ChartGeneratorService.generatePurchaseComparisonChart(
          clientData.recommendedOaPercentage,
          clientData.recommendedDiscomPercentage
      );
    }
    
    const imageOptions = {
        centered: false,
        getImage: (tagValue: any, tagName: string) => {
            if (tagName === "dashboard_screenshot" && typeof tagValue === 'string') {
                return Buffer.from(tagValue, 'base64');
            }
            // Handle all chart images - they're already buffers
            return tagValue;
        },
        getSize: (img: any, tagValue: any, tagName: string) => {
            // Different sizes for different chart types
            switch(tagName) {
                case "dashboard_screenshot":
                    return [600, 450]; // Full dashboard
                case "consumption_mix_chart":
                case "spend_comparison_chart":
                case "purchase_comparison_chart":
                    return [560, 360]; // Pie/doughnut charts
                case "daily_savings_chart":
                    return [560, 340]; // Line chart
                case "monthly_savings_chart":
                    return [600, 360]; // Bar chart
                default:
                    return [600, 360]; // Default size
            }
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
