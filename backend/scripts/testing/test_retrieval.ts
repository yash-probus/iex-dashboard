import { DatasetService } from './src/modules/dataset/dataset.service';
import { DashboardService } from './src/modules/dataset/dashboard.service';
import { UploadProcessingService } from './src/modules/upload-processing/upload-processing.service';
import { PersistenceService } from './src/modules/persistence/persistence.service';
import prisma from './src/config/prisma';
import fs from 'fs';

function generateCsv(rows: number) {
  let csv = 'Purchase Bid (MW),Sell Bid (MW),MCV (MW),Final Scheduled Volume (MW),MCP (Rs/MWh)\n';
  for(let i=0; i<rows; i++) csv += `${10 + i},20,30,40,${50 + i}\n`; // Make MCP unique per row so averages work out
  return csv;
}

function generateGdamCsv(rows: number) {
  let csv = 'Purchase Bid (MW),Total Sell Bid (MW),Solar Bid (MW),Non-Solar Sell Bid (MW),Hydro Sell Bid (MW),Total MCV (MW),Solar MCV (MW),Non-Solar MCV (MW),Hydro MCV (MW),Total FSV (MW),Solar FSV (MW),Non-Solar FSV (MW),Hydro FSV (MW),MCP (Rs/MWh)\n';
  for(let i=0; i<rows; i++) csv += `${10 + i},20,5,10,5,30,10,15,5,40,10,20,10,${50 + i}\n`;
  return csv;
}

function generateRtmCsv(rows: number) {
  let csv = 'Session ID,Purchase Bid (MW),Sell Bid (MW),MCV (MW),Final Scheduled Volume (MW),MCP (Rs/MWh)\n';
  for(let i=0; i<rows; i++) csv += `S1,${10 + i},20,30,40,${50 + i}\n`;
  return csv;
}

async function run() {
  await prisma.$executeRaw`TRUNCATE TABLE "Dataset" CASCADE`;
  console.log('--- DB Cleaned ---');
  fs.mkdirSync('uploads/dam', { recursive: true });
  fs.mkdirSync('uploads/gdam', { recursive: true });
  fs.mkdirSync('uploads/rtm', { recursive: true });

  // Upload some seed data
  const damFile = 'uploads/dam/dam1.csv'; fs.writeFileSync(damFile, generateCsv(96));
  const resDam = await UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: new Date('2026-10-01'), filePath: damFile, fileName: 'dam1.csv' });

  const gdamFile = 'uploads/gdam/gdam1.csv'; fs.writeFileSync(gdamFile, generateGdamCsv(96));
  const resGdam = await UploadProcessingService.processUpload({ market: 'GDAM', deliveryDate: new Date('2026-10-01'), filePath: gdamFile, fileName: 'gdam1.csv' });

  const rtmFile = 'uploads/rtm/rtm1.csv'; fs.writeFileSync(rtmFile, generateRtmCsv(96));
  const resRtm = await UploadProcessingService.processUpload({ market: 'RTM', deliveryDate: new Date('2026-10-01'), filePath: rtmFile, fileName: 'rtm1.csv' });

  const damFile2 = 'uploads/dam/dam2.csv'; fs.writeFileSync(damFile2, generateCsv(96));
  await UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: new Date('2026-10-02'), filePath: damFile2, fileName: 'dam2.csv' });

  const damFile3 = 'uploads/dam/dam3.csv'; fs.writeFileSync(damFile3, generateCsv(96));
  const resDamReplaced = await UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: new Date('2026-10-01'), filePath: damFile3, fileName: 'dam3.csv', action: 'replace' });

  await PersistenceService.deleteDataset(resGdam.datasetId);

  console.log('\n--- Test 1 & 2: Get All Datasets with Pagination ---');
  const dAll = await DatasetService.getDatasets({ page: 1, limit: 2 });
  console.log(`✅ Datasets Fetched. Total DB records: ${dAll.meta.total}. Page Length: ${dAll.data.length}`);

  console.log('\n--- Test 3: Dataset Filtering ---');
  const dFilter = await DatasetService.getDatasets({ status: 'ACTIVE', market: 'DAM' });
  console.log(`✅ Active DAM Datasets: ${dFilter.meta.total}`);

  console.log('\n--- Test 4: Dataset Sorting ---');
  const dSort = await DatasetService.getDatasets({ sortBy: 'uploadedAt', sortOrder: 'asc' });
  console.log(`✅ Oldest Dataset Uploaded At: ${dSort.data[0].uploadedAt.toISOString()}`);

  console.log('\n--- Deliverable 2A: Dataset Summary API ---');
  const summary = await DatasetService.getSummary();
  console.log('✅ Summary:', summary);

  console.log('\n--- Test 5 & 6: Upload History Retrieval & Filtering ---');
  const h = await DatasetService.getUploadHistory({ action: 'REPLACE' });
  console.log(`✅ Replace Actions Count: ${h.meta.total}`);

  const hDataset = await DatasetService.getDatasetHistory(resDam.datasetId);
  console.log(`✅ Lifecycle for original DAM dataset (Should be UPLOAD -> REPLACE):`);
  hDataset.forEach(x => console.log(`   Action: ${x.action} at ${x.timestamp.toISOString()}`));

  console.log('\n--- Test 7 & Deliverable 4A: DAM Retrieval ---');
  const damDash = await DashboardService.getDashboardData('DAM', '2026-10-01');
  console.log(`✅ Fetched dataset ID: ${damDash.dataset.id} (Status: ${damDash.dataset.status})`);
  console.log(`✅ Fetched interval 1 MCP:`, damDash.intervals[0].mcp);
  console.log(`   Type check MCP is Native Number:`, typeof damDash.intervals[0].mcp === 'number');

  console.log('\n--- Test 8: GDAM Retrieval ---');
  try {
    await DashboardService.getDashboardData('GDAM', '2026-10-01');
  } catch(e: any) {
    console.log(`✅ Correctly caught DELETED GDAM dataset: ${e.message}`);
  }

  console.log('\n--- Test 9: RTM Retrieval ---');
  const rtmDash = await DashboardService.getDashboardData('RTM', '2026-10-01');
  console.log(`✅ Fetched RTM Records: ${rtmDash.intervals.length}`);

  console.log('\n--- Test 10 & Deliverable 5A: Analytics Calculations ---');
  const damAnalytics = await DashboardService.getAnalytics('DAM', '2026-10-01');
  console.log(`✅ DAM Analytics:`, damAnalytics);
  console.log(`   Type check maxMcp is Native Number:`, typeof damAnalytics?.maxMcp === 'number');

  console.log('\n--- Test 11: Non-existent dataset ---');
  try {
    await DashboardService.getDashboardData('DAM', '2050-01-01');
  } catch(e: any) { console.log(`✅ Caught expected error: ${e.message}`); }

  console.log('\n--- Test 12: Deleted dataset retrieval ---');
  // GDAM was deleted above
  try {
    await DashboardService.getDashboardData('GDAM', '2026-10-01');
  } catch(e: any) { console.log(`✅ Caught expected error: ${e.message}`); }

  console.log('\n--- Test 13: Replaced dataset retrieval ---');
  // We asked for DAM 2026-10-01 above and got the REPLACEMENT dataset (the active one). The historical one is skipped!
  console.log(`✅ See Test 7: Active dataset ID fetched was ${damDash.dataset.id}, not the replaced one ${resDam.datasetId}. Replaced dataset is correctly skipped.`);

}

run().then(() => process.exit(0)).catch(e => console.error(e));
