import * as ExcelJS from 'exceljs';
import { UpsldcMeaService, UpsldcGenerator } from './upsldc-mea.service';

export class UpsldcMeaExportService {
  /**
   * Generates a comprehensive Excel report with 3 sheets:
   * 1. Inactive (Not Trading in Recent Months)
   * 2. All Open Access Generators
   * 3. Complete MEA Records History
   */
  public static async generateExcelReport(): Promise<Buffer> {
    const map = UpsldcMeaService.getGeneratorsMap();
    const allGenerators = Object.values(map);

    // Sort by name
    allGenerators.sort((a, b) => a.name.localeCompare(b.name));

    const inactiveGenerators = allGenerators.filter(g => g.status === 'NOT_TRADING_RECENT' || g.status === 'NEVER_TRADED');
    const activeGenerators = allGenerators.filter(g => g.status === 'TRADING');
    const neverTradedGenerators = allGenerators.filter(g => g.status === 'NEVER_TRADED');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Prolt Energy - IEX Dashboard';
    workbook.lastModifiedBy = 'UPSLDC MEA Monitor';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Common header styling
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002060' } // Navy blue
    };
    const headerFont: Partial<ExcelJS.Font> = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    const centerAlign: Partial<ExcelJS.Alignment> = {
      vertical: 'middle',
      horizontal: 'center'
    };
    const leftAlign: Partial<ExcelJS.Alignment> = {
      vertical: 'middle',
      horizontal: 'left'
    };
    const borderStyle: Partial<ExcelJS.Borders> = {
      top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
    };

    // -------------------------------------------------------------
    // SHEET 1: Inactive / Not Trading in Recent Months
    // -------------------------------------------------------------
    const wsInactive = workbook.addWorksheet('Not Trading (Recent Months)', {
      views: [{ showGridLines: true }]
    });

    // Title banner
    wsInactive.mergeCells('A1:H1');
    const titleCell1 = wsInactive.getCell('A1');
    titleCell1.value = 'UPSLDC Open Access (OA) Entities - Not Trading in Recent Months';
    titleCell1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC00000' } }; // Dark Red banner
    titleCell1.alignment = centerAlign;
    wsInactive.getRow(1).height = 30;

    // Subtitle info
    wsInactive.mergeCells('A2:H2');
    const subCell1 = wsInactive.getCell('A2');
    subCell1.value = `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | Total Entities Identified: ${inactiveGenerators.length} of ${allGenerators.length}`;
    subCell1.font = { name: 'Calibri', size: 10, italic: true };
    subCell1.alignment = centerAlign;
    wsInactive.getRow(2).height = 20;

    // Columns
    wsInactive.getRow(4).values = [
      'Sl. No.',
      'Generator / Consumer Name',
      'UPSLDC ID',
      'Category',
      'Status',
      'Last Traded Month & Year',
      'Last Bill Despatched Date',
      'Latest MEA PDF Link'
    ];
    wsInactive.getRow(4).height = 26;
    wsInactive.getRow(4).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
    });

    let rowIdx = 5;
    inactiveGenerators.forEach((g, idx) => {
      const row = wsInactive.getRow(rowIdx);
      const lastTradedStr = g.lastTradedYear && g.lastTradedMonth ? `${g.lastTradedMonth} ${g.lastTradedYear}` : 'No Data';

      row.values = [
        idx + 1,
        g.name,
        g.genId,
        g.category || 'OA',
        g.status === 'NEVER_TRADED' ? 'Never Traded' : 'Not Trading (Recent)',
        lastTradedStr,
        g.lastTradedDate || '-',
        g.latestPdfUrl || '-'
      ];

      row.getCell(1).alignment = centerAlign;
      row.getCell(2).alignment = leftAlign;
      row.getCell(3).alignment = centerAlign;
      row.getCell(4).alignment = centerAlign;
      
      // Status badge cell
      const statusCell = row.getCell(5);
      statusCell.alignment = centerAlign;
      statusCell.font = { bold: true, color: { argb: 'FF9C0006' } };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }; // Light red badge

      // Last traded highlight cell
      const lastTradedCell = row.getCell(6);
      lastTradedCell.alignment = centerAlign;
      lastTradedCell.font = { bold: true };

      row.getCell(7).alignment = centerAlign;

      // PDF link formatting
      const linkCell = row.getCell(8);
      if (g.latestPdfUrl && g.latestPdfUrl.startsWith('http')) {
        linkCell.value = {
          text: 'View MEA PDF',
          hyperlink: g.latestPdfUrl
        };
        linkCell.font = { color: { argb: 'FF0563C1' }, underline: true };
      }
      linkCell.alignment = centerAlign;

      row.eachCell((cell) => {
        cell.border = borderStyle;
      });

      row.height = 20;
      rowIdx++;
    });

    wsInactive.columns = [
      { width: 10 },
      { width: 45 },
      { width: 14 },
      { width: 12 },
      { width: 30 },
      { width: 25 },
      { width: 25 },
      { width: 22 }
    ];

    // -------------------------------------------------------------
    // SHEET 2: Master List of All 615 Open Access Generators
    // -------------------------------------------------------------
    const wsAll = workbook.addWorksheet('All OA Generators', {
      views: [{ showGridLines: true }]
    });

    wsAll.mergeCells('A1:I1');
    const titleCell2 = wsAll.getCell('A1');
    titleCell2.value = 'UPSLDC Master Directory - All Open Access (OA) Generators & MEA Status';
    titleCell2.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell2.fill = headerFill;
    titleCell2.alignment = centerAlign;
    wsAll.getRow(1).height = 30;

    wsAll.mergeCells('A2:I2');
    const subCell2 = wsAll.getCell('A2');
    subCell2.value = `Total Registry: ${allGenerators.length} | Actively Trading: ${activeGenerators.length} | Inactive / Dormant: ${inactiveGenerators.length} | Never Traded: ${neverTradedGenerators.length}`;
    subCell2.font = { name: 'Calibri', size: 10, italic: true };
    subCell2.alignment = centerAlign;
    wsAll.getRow(2).height = 20;

    wsAll.getRow(4).values = [
      'Sl. No.',
      'Generator / Consumer Name',
      'UPSLDC ID',
      'Category',
      'Status',
      'Last Traded Month & Year',
      'Last Bill Despatched Date',
      'Total Months Recorded',
      'Latest MEA PDF'
    ];
    wsAll.getRow(4).height = 26;
    wsAll.getRow(4).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
    });

    rowIdx = 5;
    allGenerators.forEach((g, idx) => {
      const row = wsAll.getRow(rowIdx);
      const lastTradedStr = g.lastTradedYear && g.lastTradedMonth ? `${g.lastTradedMonth} ${g.lastTradedYear}` : '-';

      let statusDisplay = 'Never Traded';
      let fontColor = 'FF595959';
      let bgColor = 'FFF2F2F2';

      if (g.status === 'TRADING') {
        statusDisplay = 'Actively Trading';
        fontColor = 'FF006100';
        bgColor = 'FFC6EFCE'; // Light green
      } else if (g.status === 'NOT_TRADING_RECENT') {
        statusDisplay = 'Not Trading (Recent Months)';
        fontColor = 'FF9C0006';
        bgColor = 'FFFFC7CE'; // Light red
      }

      row.values = [
        idx + 1,
        g.name,
        g.genId,
        g.category || 'OA',
        statusDisplay,
        lastTradedStr,
        g.lastTradedDate || '-',
        g.totalRecords || 0,
        g.latestPdfUrl || '-'
      ];

      row.getCell(1).alignment = centerAlign;
      row.getCell(2).alignment = leftAlign;
      row.getCell(3).alignment = centerAlign;
      row.getCell(4).alignment = centerAlign;

      const sCell = row.getCell(5);
      sCell.alignment = centerAlign;
      sCell.font = { bold: true, color: { argb: fontColor } };
      sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };

      row.getCell(6).alignment = centerAlign;
      row.getCell(7).alignment = centerAlign;
      row.getCell(8).alignment = centerAlign;

      const linkCell = row.getCell(9);
      if (g.latestPdfUrl && g.latestPdfUrl.startsWith('http')) {
        linkCell.value = {
          text: 'View MEA PDF',
          hyperlink: g.latestPdfUrl
        };
        linkCell.font = { color: { argb: 'FF0563C1' }, underline: true };
      }
      linkCell.alignment = centerAlign;

      row.eachCell((cell) => {
        cell.border = borderStyle;
      });

      row.height = 20;
      rowIdx++;
    });

    wsAll.columns = [
      { width: 10 },
      { width: 45 },
      { width: 14 },
      { width: 12 },
      { width: 30 },
      { width: 25 },
      { width: 25 },
      { width: 22 },
      { width: 20 }
    ];

    // -------------------------------------------------------------
    // SHEET 3: Complete Monthly Energy Account Records History
    // -------------------------------------------------------------
    const wsHistory = workbook.addWorksheet('MEA Historical Records', {
      views: [{ showGridLines: true }]
    });

    wsHistory.mergeCells('A1:G1');
    const titleCell3 = wsHistory.getCell('A1');
    titleCell3.value = 'UPSLDC Monthly Energy Account (MEA) - All Records History';
    titleCell3.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell3.fill = headerFill;
    titleCell3.alignment = centerAlign;
    wsHistory.getRow(1).height = 30;

    wsHistory.getRow(3).values = [
      'Sl. No.',
      'Generator / Consumer Name',
      'UPSLDC ID',
      'Month & Year',
      'Version',
      'Bill Despatched Date',
      'Direct PDF Link'
    ];
    wsHistory.getRow(3).height = 26;
    wsHistory.getRow(3).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = centerAlign;
    });

    rowIdx = 4;
    let recordCounter = 1;

    for (const g of allGenerators) {
      if (g.records && g.records.length > 0) {
        for (const r of g.records) {
          const row = wsHistory.getRow(rowIdx);
          row.values = [
            recordCounter++,
            g.name,
            g.genId,
            `${r.month} ${r.year}`,
            r.version || '1',
            r.despatchedDate || '-',
            r.pdfUrl || '-'
          ];

          row.getCell(1).alignment = centerAlign;
          row.getCell(2).alignment = leftAlign;
          row.getCell(3).alignment = centerAlign;
          row.getCell(4).alignment = centerAlign;
          row.getCell(5).alignment = centerAlign;
          row.getCell(6).alignment = centerAlign;

          const linkCell = row.getCell(7);
          if (r.pdfUrl && r.pdfUrl.startsWith('http')) {
            linkCell.value = {
              text: 'Download PDF',
              hyperlink: r.pdfUrl
            };
            linkCell.font = { color: { argb: 'FF0563C1' }, underline: true };
          }
          linkCell.alignment = centerAlign;

          row.eachCell((cell) => {
            cell.border = borderStyle;
          });

          row.height = 19;
          rowIdx++;
        }
      }
    }

    wsHistory.columns = [
      { width: 10 },
      { width: 45 },
      { width: 14 },
      { width: 18 },
      { width: 12 },
      { width: 25 },
      { width: 25 }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

