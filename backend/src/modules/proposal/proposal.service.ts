import fs from 'fs';
import path from 'path';
import os from 'os';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
// @ts-ignore
import ImageModule from 'docxtemplater-image-module-free';
import { ChartGeneratorService } from './chartGenerator.service';
import { execFileSync } from 'child_process';

function formatRupee(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'number') {
    const parts = val.toFixed(2).split('.');
    const s = parts[0];
    const d = parts[1];
    let r = '';
    for (let i = s.length - 1, count = 0; i >= 0; i--, count++) {
      if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
        r = ',' + r;
      }
      r = s[i] + r;
    }
    return '₹' + r + '.' + d;
  }
  const str = String(val).trim();
  if (str.startsWith('₹')) return str;
  const num = parseFloat(str.replace(/,/g, '').replace(/₹/g, '').replace(/\/kWh/g, '').replace(/%/g, ''));
  if (!isNaN(num)) return formatRupee(num);
  return str;
}

export class ProposalService {
  public async generateProposal(clientData: any, type: 'technical' | 'commercial' | 'default' = 'default'): Promise<Buffer> {
    if (type === 'commercial') {
      const templatePath = fs.existsSync(path.join(__dirname, '../../../assets/templates/COMMERCIAL PROPOSAL_33KV.docx'))
        ? path.join(__dirname, '../../../assets/templates/COMMERCIAL PROPOSAL_33KV.docx')
        : (fs.existsSync(path.join(__dirname, '../../../assets/templates/commercial_proposal_template.docx')) 
            ? path.join(__dirname, '../../../assets/templates/commercial_proposal_template.docx')
            : path.join(__dirname, '../../../assets/templates/commercial_proposal_template.docx'));

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at ${templatePath}`);
      }

      // Dynamic Defaults Logic
      const state = String(clientData.state || '').trim().toUpperCase();
      const discom = String(clientData.discom_name || clientData.discom || '').trim().toUpperCase();
      const voltage = String(clientData.connectivity || clientData.voltage_level || clientData.voltageLevel || '').trim().toUpperCase();
      
      let defaultSupply = 450000;
      let defaultService = 350000;
      let defaultLiaison = 300000;
      let defaultSmart = 125000;
      let indoorCount = "1 Nos.";
      let removeOutdoorSupply = false;

      if (state === 'UP') {
        defaultLiaison = 395000;
        defaultSmart = 170000;
        
        if (voltage.includes('33') && (voltage.includes('KV') || voltage.includes('K V'))) {
          if (discom.includes('NPCL')) {
            defaultSupply = 845000;
            defaultService = 358000;
            indoorCount = "2 Nos.";
            removeOutdoorSupply = true;
          } else {
            defaultSupply = 745000;
            defaultService = 358000;
          }
        } else { // 11kV (All Discoms)
          defaultSupply = 565000;
          defaultService = 338000;
        }
      }

      clientData.abt_supply_cost = clientData.abt_supply_cost || defaultSupply;
      clientData.abt_service_cost = clientData.abt_service_cost || defaultService;
      clientData.utility_liaisoning_cost = clientData.utility_liaisoning_cost || defaultLiaison;
      clientData.smart_metering_infra = clientData.smart_metering_infra || defaultSmart;
      clientData.indoor_ctpt_count = indoorCount;
      clientData.remove_outdoor_supply = removeOutdoorSupply;

      // Execute Python script to generate the document
      try {
        const scriptPath = path.join(__dirname, '../../../scripts/generate_commercial_proposal.py');
        const tmpDir = os.tmpdir();
        const tmpOutputPath = path.join(tmpDir, `commercial_proposal_${Date.now()}.docx`);
        const payload = { ...clientData, template_path: templatePath, output_path: tmpOutputPath };
        execFileSync('python3', [scriptPath, JSON.stringify(payload)], { encoding: 'utf-8' });
        
        if (fs.existsSync(tmpOutputPath)) {
          const buf = fs.readFileSync(tmpOutputPath);
          try { fs.unlinkSync(tmpOutputPath); } catch (e) {}
          return buf;
        } else {
          throw new Error("Python script did not produce an output file.");
        }
      } catch (pythonErr: any) {
        console.error('PYTHON SCRIPT ERROR:', pythonErr.stderr || pythonErr.message);
        throw new Error('Failed to generate commercial proposal document. Python Script Error: ' + (pythonErr.stderr || pythonErr.message));
      }
    }

    let templateFilename = 'proposal_template.docx';
    if (type === 'technical') {
      templateFilename = 'technical_proposal_template.docx';
    }

    const templatePath = path.join(__dirname, '../../../assets/templates/', templateFilename);
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    
    // Generate all charts (Puppeteer)
    if (clientData.monthlyData && clientData.monthlyData.length > 0) {
      try {
        const buf = await ChartGeneratorService.generateSavingsChart(
            clientData.monthlyData,
            clientData.monthlySavings || '0',
            clientData.savings_in_words || 'Twenty Five'
        );
        clientData.monthly_savings_chart = buf.toString('base64');
      } catch (error) {
        console.error("Failed to generate monthly_savings_chart:", error);
      }
    }

    // Generate consumption mix chart
    if (clientData.oaPercentage !== undefined && clientData.discomPercentage !== undefined) {
      try {
        const buf = await ChartGeneratorService.generateConsumptionMixChart(
            clientData.oaPercentage,
            clientData.discomPercentage,
            clientData.oaUnits || 0,
            clientData.discomUnits || 0
        );
        clientData.consumption_mix_chart = buf.toString('base64');
      } catch (error) {
        console.error("Failed to generate consumption_mix_chart:", error);
      }
    }

    // Generate spend comparison chart
    if (clientData.actualSpend !== undefined && clientData.optimizedSpend !== undefined) {
      try {
        const buf = await ChartGeneratorService.generateSpendComparisonChart(
            clientData.actualSpend,
            clientData.optimizedSpend,
            clientData.monthLabel || 'Current Month'
        );
        clientData.spend_comparison_chart = buf.toString('base64');
      } catch (error) {
        console.error("Failed to generate spend_comparison_chart:", error);
      }
    }

    // Generate daily savings chart
    if (clientData.dailyData && clientData.dailyData.length > 0) {
      try {
        const buf = await ChartGeneratorService.generateDailySavingsChart(
            clientData.dailyData,
            clientData.monthLabel || 'Current Month'
        );
        clientData.daily_savings_chart = buf.toString('base64');
      } catch (error) {
        console.error("Failed to generate daily_savings_chart:", error);
      }
    }

    // Generate purchase comparison chart
    if (clientData.recommendedOaPercentage !== undefined && clientData.recommendedDiscomPercentage !== undefined) {
      try {
        const buf = await ChartGeneratorService.generatePurchaseComparisonChart(
            clientData.recommendedOaPercentage,
            clientData.recommendedDiscomPercentage
        );
        clientData.purchase_comparison_chart = buf.toString('base64');
      } catch (error) {
        console.error("Failed to generate purchase_comparison_chart:", error);
      }
    }
    
    const imageOptions = {
        centered: false,
        getImage: (tagValue: any, tagName: string) => {
            if (!tagValue) return false;

            if (typeof tagValue === 'string') {
                const buf = Buffer.from(tagValue, 'base64');
                if (buf.length === 0) return false;
                return buf;
            }
            
            if (Buffer.isBuffer(tagValue)) {
                if (tagValue.length === 0) return false;
                return tagValue;
            }
            return false;
        },
        getSize: (img: any, tagValue: any, tagName: string) => {
            // Different sizes for different chart types
            switch(tagName) {
                case "dashboard_screenshot":
                case "first_insight_screenshot":
                case "second_insight_screenshot":
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
    } catch (error: any) {
        console.warn("Docxtemplater rendering error (likely missing tags):", error);
    }

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buf;
  }
}
