const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'frontend/src/pages/resource-center');
const adminDir = path.join(__dirname, 'frontend/src/pages/admin/resource-center');

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

  // 1. Replace Mock Import with useResourceData
  content = content.replace(
    new RegExp(`import { ${page.mock} } from './mockData';\\s*`),
    `import { useResourceData } from '../../hooks/useResourceData';\nimport { CircularProgress } from '@mui/material';\n`
  );

  // 2. Replace useState with useResourceData hook
  content = content.replace(
    new RegExp(`const \\[data\\] = useState\\(${page.mock}\\);`),
    `const { data, loading, error } = useResourceData<${page.typeName}>('${page.type}');`
  );

  // 3. Update Empty State Message
  const emptyStateRegex = new RegExp(`emptyStateMessage=\\{\\s*<Box[\\s\\S]*?<Typography[^>]*>\\s*No ${page.name} data available.[\\s\\S]*?</Box>\\s*\\}`);
  
  const newEmptyState = `emptyStateMessage={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              {loading ? (
                <CircularProgress size={32} sx={{ mb: 2 }} />
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : (
                <>
                  <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                    No ${page.name} data available.
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', opacity: 0.8 }}>
                    Data will appear here once records are added.
                  </Typography>
                </>
              )}
            </Box>
          }`;
          
  content = content.replace(emptyStateRegex, newEmptyState);
  
  fs.writeFileSync(filePath, content, 'utf8');
}

// 4. Update AdminResourcePage.tsx
const adminFile = path.join(adminDir, 'AdminResourcePage.tsx');
if (fs.existsSync(adminFile)) {
  let adminContent = fs.readFileSync(adminFile, 'utf8');

  adminContent = adminContent.replace(
    `import { mockAdminStore } from './mockAdminStore';`,
    `import { useResourceData } from '../../../hooks/useResourceData';\nimport { CircularProgress } from '@mui/material';`
  );

  adminContent = adminContent.replace(
    /const \[data, setData\] = useState<any\[\]>\(\[\]\);\s*useEffect\(\(\) => \{\s*const unsubscribe = mockAdminStore\.subscribe\(resourceType, \(newData\) => \{\s*setData\(newData\);\s*\}\);\s*return \(\) => unsubscribe\(\);\s*\}, \[resourceType\]\);/g,
    `const { data, loading, error, refresh } = useResourceData<any>(resourceType);`
  );
  
  adminContent = adminContent.replace(
    `emptyStateMessage={config.emptyState}`,
    `emptyStateMessage={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              {loading ? (
                <CircularProgress size={32} sx={{ mb: 2 }} />
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : (
                config.emptyState
              )}
            </Box>
          }`
  );

  fs.writeFileSync(adminFile, adminContent, 'utf8');
}

console.log("Pages updated successfully.");
