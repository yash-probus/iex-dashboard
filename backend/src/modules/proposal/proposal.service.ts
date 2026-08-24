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

      // Primary: Try Python script (python-docx cleanly replaces cell text, calculates totals, and strips all yellow highlights)
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
        }
      } catch (pythonErr: any) {
        console.warn('Python script execution failed, falling back to Node PizZip:', pythonErr.stderr || pythonErr.message);
      }

      // Fallback: Pure Node.js PizZip template replacement
      function setLastCellText(rowXml: string, newText: string, isBold?: boolean) {
        let cells = rowXml.split('</w:tc>');
        if (cells.length > 1) {
          const lastIdx = cells.length - 2;
          const boldXml = isBold ? '<w:b/><w:bCs/>' : '';
          const cellContent = `<w:pPr><w:jc w:val="center"/><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:cs="Arial"/>${boldXml}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:cs="Arial"/>${boldXml}<w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>${newText}</w:t></w:r>`;
          cells[lastIdx] = cells[lastIdx].replace(/<w:p\b[^>]*>[\s\S]*<\/w:p>/, `<w:p>${cellContent}</w:p>`);
        }
        return cells.join('</w:tc>');
      }

      const zip = new PizZip(fs.readFileSync(templatePath, 'binary'));
      let xml = zip.file('word/document.xml')?.asText() || '';

      // 1. Remove all yellow highlights in entire XML
      xml = xml.replace(/<w:highlight [^/>]*\/>/g, '');

      // 2. Title Paragraph P2
      const clientName = (clientData.client_name || clientData.industry_name || clientData.clientName || 'CLIENT').toUpperCase();
      xml = xml.replace(/XXXXXXXXXXXXX/g, clientName);

      // 3. Process Tables
      const tblRegex = /<w:tbl\b[\s\S]*?<\/w:tbl>/g;
      let tableIndex = 0;
      xml = xml.replace(tblRegex, (match) => {
        const currentIdx = tableIndex++;
        let rows = match.split('</w:tr>');

        if (currentIdx === 0) {
          if (rows.length > 1) {
            let cells = rows[1].split('</w:tc>');
            if (cells.length >= 4) {
              const loadVal = String(clientData.sanctioned_load || clientData.sanctioned_load_kw || clientData.sanctionedLoadKw || '1000 kW');
              const connVal = String(clientData.connectivity || clientData.voltage_level || clientData.voltageLevel || '11 kV');
              const discomVal = String(clientData.discom_name || clientData.discom || 'DISCOM');
              const feederVal = String(clientData.feeder_type || 'Dedicated Feeder');

              cells[0] = setLastCellText(cells[0] + '</w:tc>', loadVal, true).replace('</w:tc>', '');
              cells[1] = setLastCellText(cells[1] + '</w:tc>', connVal, true).replace('</w:tc>', '');
              cells[2] = setLastCellText(cells[2] + '</w:tc>', discomVal, true).replace('</w:tc>', '');
              cells[3] = setLastCellText(cells[3] + '</w:tc>', feederVal, true).replace('</w:tc>', '');
              rows[1] = cells.join('</w:tc>');
            }
          }
        } else if (currentIdx === 2) {
          // Table 2 (Fixed One-Time Cost)
          const c_supply = Number(clientData.abt_supply_cost);
          const c_service = Number(clientData.abt_service_cost);
          const c_liaison = Number(clientData.utility_liaisoning_cost);
          const c_total = c_supply + c_service + c_liaison;
          const c_bg = Number(clientData.bank_guarantee_cost) || 150000;

          if (rows[2]) {
            let row2Str = rows[2];
            row2Str = row2Str.replace('1 Nos.', clientData.indoor_ctpt_count);
            if (clientData.remove_outdoor_supply) {
              row2Str = row2Str.replace(/<w:p\b[^>]*>.*?Outdoor CT\/PT.*?<\/w:p>/g, '');
            }
            rows[2] = setLastCellText(row2Str, formatRupee(c_supply), false);
          }
          if (rows[3]) rows[3] = setLastCellText(rows[3], formatRupee(c_service), false);
          if (rows[4]) rows[4] = setLastCellText(rows[4], formatRupee(c_liaison), false);
          if (rows[5]) rows[5] = setLastCellText(rows[5], formatRupee(c_liaison), false);
          if (rows[6]) rows[6] = setLastCellText(rows[6], formatRupee(c_total), true); // TOTAL CELL!
          if (rows[8]) rows[8] = setLastCellText(rows[8], formatRupee(c_bg), false);
        } else if (currentIdx === 3) {
          // Table 3 (Fixed Recurring Charges)
          if (rows[1]) rows[1] = setLastCellText(rows[1], formatRupee(Number(clientData.iex_annual_fee) || 100000), false);
          if (rows[2]) rows[2] = setLastCellText(rows[2], formatRupee(Number(clientData.sldc_monthly_noc) || 7000), false);
          if (rows[3]) rows[3] = setLastCellText(rows[3], formatRupee(Number(clientData.st11_settlement) || 20000), false);
        } else if (currentIdx === 4) {
          // Table 4 (Probus Fees)
          const tm = String(clientData.trading_margin || '2p/kWh');
          const pf = String(clientData.platform_fee || '2p/kWh');
          const vs = String(clientData.value_share || '15%');
          const smart = Number(clientData.smart_metering_infra) || 125000;

          if (rows[1]) rows[1] = setLastCellText(rows[1], tm, false);
          if (rows[2]) rows[2] = setLastCellText(rows[2], pf, false);
          if (rows[3]) rows[3] = setLastCellText(rows[3], vs, false);
          if (rows[4]) rows[4] = setLastCellText(rows[4], formatRupee(smart), false);
        }

        return rows.join('</w:tr>');
      });

      zip.file('word/document.xml', xml);
      return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
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
