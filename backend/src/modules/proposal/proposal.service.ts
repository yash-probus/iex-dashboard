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
      const templatePath = fs.existsSync('/Users/yashgupta/IEX-Dashboard/COMMERCIAL PROPOSAL_V2.docx')
        ? '/Users/yashgupta/IEX-Dashboard/COMMERCIAL PROPOSAL_V2.docx'
        : path.join(__dirname, '../../../assets/templates/commercial_proposal_template.docx');

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at ${templatePath}`);
      }

      // Try Node.js PizZip template replacement (pure Node, zero python dependency)
      try {
        const zip = new PizZip(fs.readFileSync(templatePath, 'binary'));
        let xml = zip.file('word/document.xml')?.asText() || '';

        // 1. Title Paragraph P2
        const clientName = (clientData.client_name || clientData.industry_name || clientData.clientName || 'CLIENT').toUpperCase();
        xml = xml.replace(/XXXXXXXXXXXXX/g, clientName);

        // 2. Table 0 Cells
        const tableSplit = xml.split(/<w:tbl\b[^>]*>/);
        if (tableSplit.length > 1) {
          let t0Xml = tableSplit[1].split('</w:tbl>')[0];
          let t0Rows = t0Xml.split('</w:tr>');
          if (t0Rows.length > 1) {
            let r1Cells = t0Rows[1].split('</w:tc>');
            if (r1Cells.length >= 4) {
              const loadVal = String(clientData.sanctioned_load || clientData.sanctioned_load_kw || clientData.sanctionedLoadKw || '1000 kW');
              const connVal = String(clientData.connectivity || clientData.voltage_level || clientData.voltageLevel || '11 kV');
              const discomVal = String(clientData.discom_name || clientData.discom || 'DISCOM');
              const feederVal = String(clientData.feeder_type || 'Dedicated Feeder');

              r1Cells[0] = r1Cells[0].replace(/<w:t\b[^>]*>[^<]*<\/w:t>/, `<w:t>${loadVal}</w:t>`);
              r1Cells[1] = r1Cells[1].replace(/<w:t\b[^>]*>[^<]*<\/w:t>/, `<w:t>${connVal}</w:t>`);
              r1Cells[2] = r1Cells[2].replace(/<w:t\b[^>]*>[^<]*<\/w:t>/, `<w:t>${discomVal}</w:t>`);
              r1Cells[3] = r1Cells[3].replace(/<w:t\b[^>]*>[^<]*<\/w:t>/, `<w:t>${feederVal}</w:t>`);
              t0Rows[1] = r1Cells.join('</w:tc>');
            }
            t0Xml = t0Rows.join('</w:tr>');
          }
          tableSplit[1] = t0Xml + '</w:tbl>' + tableSplit[1].split('</w:tbl>').slice(1).join('</w:tbl>');
          xml = tableSplit.join('<w:tbl>');
        }

        // 3. Financial Prices Replacement (Table 2, 3, 4)
        const c_supply = Number(clientData.abt_supply_cost) || 450000;
        const c_service = Number(clientData.abt_service_cost) || 350000;
        const c_liaison = Number(clientData.utility_liaisoning_cost) || 300000;
        const c_total = c_supply + c_service + c_liaison;
        const c_bg = Number(clientData.bank_guarantee_cost) || 150000;

        xml = xml.replace('₹450,000.00', formatRupee(c_supply));
        xml = xml.replace('₹350,000.00', formatRupee(c_service));
        xml = xml.replace('₹300,000.00', formatRupee(c_liaison));
        xml = xml.replace('₹11,00,000.00', formatRupee(c_total));
        xml = xml.replace('1,50,000.00', formatRupee(c_bg).replace('₹', ''));
        xml = xml.replace('₹1,50,000.00', formatRupee(c_bg));

        // Table 3
        xml = xml.replace('₹1,00,000.00', formatRupee(Number(clientData.iex_annual_fee) || 100000));
        xml = xml.replace('₹7,000.00', formatRupee(Number(clientData.sldc_monthly_noc) || 7000));
        xml = xml.replace('20,000.00', formatRupee(Number(clientData.st11_settlement) || 20000).replace('₹', ''));

        // Table 4
        if (clientData.trading_margin) xml = xml.replace('2p/kWh', clientData.trading_margin);
        if (clientData.value_share) xml = xml.replace('15%', clientData.value_share);
        if (clientData.smart_metering_infra) xml = xml.replace('₹1,25,000.00', formatRupee(Number(clientData.smart_metering_infra) || 125000));

        zip.file('word/document.xml', xml);
        return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      } catch (nodeErr) {
        console.warn('Node PizZip generation failed, falling back to Python:', nodeErr);
        // Fallback to Python if available
        const scriptPath = path.join(__dirname, '../../../scripts/generate_commercial_proposal.py');
        const tmpDir = os.tmpdir();
        const tmpOutputPath = path.join(tmpDir, `commercial_proposal_${Date.now()}.docx`);
        const payload = { ...clientData, template_path: templatePath, output_path: tmpOutputPath };
        execFileSync('python3', [scriptPath, JSON.stringify(payload)], { encoding: 'utf-8' });
        const buf = fs.readFileSync(tmpOutputPath);
        try { fs.unlinkSync(tmpOutputPath); } catch (e) {}
        return buf;
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
