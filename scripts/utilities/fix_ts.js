const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages/resource-center');

const pages = [
  { file: 'RegionStatePage.tsx', type: 'region-state', mock: 'REGION_STATE_MOCK_DATA', typeName: 'RegionState', name: 'Region State' },
  { file: 'DiscomListPage.tsx', type: 'discom-list', mock: 'DISCOM_LIST_MOCK_DATA', typeName: 'DiscomList', name: 'Discom List' },
  { file: 'IstsChargesPage.tsx', type: 'ists-charges', mock: 'ISTS_CHARGES_MOCK_DATA', typeName: 'IstsCharges', name: 'ISTS Charges' },
  { file: 'IexFeesPage.tsx', type: 'iex-fees', mock: 'IEX_FEES_MOCK_DATA', typeName: 'IexFees', name: 'IEX Fees' },
  { file: 'ProltMarginPage.tsx', type: 'prolt-margin', mock: 'PROLT_MARGIN_MOCK_DATA', typeName: 'ProltMargin', name: 'ProLT Margin' },
  { file: 'CtuChargesPage.tsx', type: 'ctu-charges', mock: 'CTU_CHARGES_MOCK_DATA', typeName: 'CtuCharges', name: 'CTU Charges' },
  { file: 'StuChargesPage.tsx', type: 'stu-charges', mock: 'STU_CHARGES_MOCK_DATA', typeName: 'StuCharges', name: 'STU Charges' },
  { file: 'StateTariffPage.tsx', type: 'state-tariff', mock: 'STATE_TARIFF_MOCK_DATA', typeName: 'StateTariff', name: 'State Tariff' }
];

for (const page of pages) {
  const filePath = path.join(pagesDir, page.file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix Mock Import
  content = content.replace(
    new RegExp(`import \\{ ${page.mock} \\} from '\\./mockData[^']*';\\s*`),
    `import { useResourceData } from '../../hooks/useResourceData';\nimport { CircularProgress } from '@mui/material';\n`
  );

  // Fix valueFormatter returning numbers to string and handling any
  content = content.replace(/valueFormatter:\s*\(([^)]+)\)\s*=>\s*([^,]+)(?=,|\n)/g, (match, param, expression) => {
    // If it already has type or doesn't look like formatting, skip or fix
    const cleanedParam = param.trim();
    if (cleanedParam.includes(':')) return match; // Already typed
    
    // Ensure it returns a string and handles nulls
    return `valueFormatter: (${cleanedParam}: any) => ${cleanedParam} != null ? String(${expression}) : '-'`;
  });

  // Fix row type in export
  content = content.replace(/filteredData\.map\(\s*row\s*=>/g, `filteredData.map((row: any) =>`);

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Pages TS fixed.");
