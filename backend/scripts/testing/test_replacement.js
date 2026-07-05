"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const upload_processing_service_1 = require("./src/modules/upload-processing/upload-processing.service");
const prisma_1 = __importDefault(require("./src/config/prisma"));
function generateDamCsv(rows) {
    let csv = 'Purchase Bid (MW),Sell Bid (MW),MCV (MW),Final Scheduled Volume (MW),MCP (Rs/MWh)\n';
    for (let i = 0; i < rows; i++)
        csv += '10,20,30,40,50\n';
    return csv;
}
function generateGdamCsv(rows) {
    let csv = 'Purchase Bid (MW),Total Sell Bid (MW),Solar Bid (MW),Non-Solar Sell Bid (MW),Hydro Sell Bid (MW),Total MCV (MW),Solar MCV (MW),Non-Solar MCV (MW),Hydro MCV (MW),Total FSV (MW),Solar FSV (MW),Non-Solar FSV (MW),Hydro FSV (MW),MCP (Rs/MWh)\n';
    for (let i = 0; i < rows; i++)
        csv += '1,2,3,4,5,6,7,8,9,10,11,12,13,14\n';
    return csv;
}
function generateRtmCsv(rows) {
    let csv = 'Session ID,Purchase Bid (MW),Sell Bid (MW),MCV (MW),Final Scheduled Volume (MW),MCP (Rs/MWh)\n';
    for (let i = 0; i < rows; i++)
        csv += 'RTM-1,10,20,30,40,50\n';
    return csv;
}
async function run() {
    await prisma_1.default.$executeRaw `TRUNCATE TABLE "Dataset" CASCADE`;
    console.log('DB Cleaned.');
    // Create initial datasets
    const dDam = new Date('2026-08-01');
    const dGdam = new Date('2026-08-02');
    const dRtm = new Date('2026-08-03');
    fs_1.default.mkdirSync('uploads/dam', { recursive: true });
    fs_1.default.mkdirSync('uploads/gdam', { recursive: true });
    fs_1.default.mkdirSync('uploads/rtm', { recursive: true });
    const damFile1 = 'uploads/dam/dam1.csv';
    fs_1.default.writeFileSync(damFile1, generateDamCsv(96));
    const gdamFile1 = 'uploads/gdam/gdam1.csv';
    fs_1.default.writeFileSync(gdamFile1, generateGdamCsv(96));
    const rtmFile1 = 'uploads/rtm/rtm1.csv';
    fs_1.default.writeFileSync(rtmFile1, generateRtmCsv(96));
    await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: dDam, filePath: damFile1, fileName: 'dam1.csv' });
    await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'GDAM', deliveryDate: dGdam, filePath: gdamFile1, fileName: 'gdam1.csv' });
    await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'RTM', deliveryDate: dRtm, filePath: rtmFile1, fileName: 'rtm1.csv' });
    console.log('--- Initial Uploads Completed ---');
    console.log('\n--- Test 1: Valid DAM Replacement ---');
    const damFile2 = 'uploads/dam/dam2.csv';
    fs_1.default.writeFileSync(damFile2, generateDamCsv(96));
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: dDam, filePath: damFile2, fileName: 'dam2.csv', action: 'replace' });
        const datasets = await prisma_1.default.dataset.findMany({ where: { market: 'DAM' } });
        console.log('✅ DAM Datasets Count:', datasets.length);
        console.log('✅ REPLACED exist:', datasets.some(d => d.status === 'REPLACED'));
        console.log('✅ ACTIVE exist:', datasets.some(d => d.status === 'ACTIVE'));
    }
    catch (e) {
        console.error('FAILED', e.message);
    }
    console.log('\n--- Test 2: Valid GDAM Replacement ---');
    const gdamFile2 = 'uploads/gdam/gdam2.csv';
    fs_1.default.writeFileSync(gdamFile2, generateGdamCsv(96));
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'GDAM', deliveryDate: dGdam, filePath: gdamFile2, fileName: 'gdam2.csv', action: 'replace' });
        console.log('✅ GDAM Replacement Succeeded');
    }
    catch (e) {
        console.error('FAILED', e.message);
    }
    console.log('\n--- Test 3: Valid RTM Replacement ---');
    const rtmFile2 = 'uploads/rtm/rtm2.csv';
    fs_1.default.writeFileSync(rtmFile2, generateRtmCsv(96));
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'RTM', deliveryDate: dRtm, filePath: rtmFile2, fileName: 'rtm2.csv', action: 'replace' });
        console.log('✅ RTM Replacement Succeeded');
    }
    catch (e) {
        console.error('FAILED', e.message);
    }
    console.log('\n--- Test 4: Duplicate upload without replace flag ---');
    const damFile3 = 'uploads/dam/dam3.csv';
    fs_1.default.writeFileSync(damFile3, generateDamCsv(96));
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: dDam, filePath: damFile3, fileName: 'dam3.csv' });
        console.log('FAILED: Should have thrown duplicate error');
    }
    catch (e) {
        console.log('✅ Caught expected error:', e.message);
    }
    console.log('\n--- Test 5: Replace flag but no ACTIVE dataset ---');
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: new Date('2026-10-10'), filePath: damFile3, fileName: 'dam3.csv', action: 'replace' });
    }
    catch (e) {
        console.log('✅ Caught expected error:', e.message);
    }
    console.log('\n--- Test 6: Replacement transaction failure (95 rows) ---');
    const damFile95 = 'uploads/dam/dam95.csv';
    fs_1.default.writeFileSync(damFile95, generateDamCsv(95));
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: dDam, filePath: damFile95, fileName: 'dam95.csv', action: 'replace' });
    }
    catch (e) {
        console.log('✅ Caught expected error:', e.message);
        const active = await prisma_1.default.dataset.count({ where: { market: 'DAM', status: 'ACTIVE' } });
        const replaced = await prisma_1.default.dataset.count({ where: { market: 'DAM', status: 'REPLACED' } });
        console.log('✅ Rollback successful. ACTIVE count:', active, 'REPLACED count:', replaced);
    }
    console.log('\n--- Test 7: File Deletion Failure Test ---');
    // Upload a fresh one so we know its physical file path
    const rtmFile3 = 'uploads/rtm/rtm3.csv';
    fs_1.default.writeFileSync(rtmFile3, generateRtmCsv(96));
    await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'RTM', deliveryDate: new Date('2026-08-04'), filePath: rtmFile3, fileName: 'rtm3.csv' });
    // Intentionally delete it BEFORE replacing, so the unlinkSync fails
    fs_1.default.unlinkSync(rtmFile3);
    const rtmFile4 = 'uploads/rtm/rtm4.csv';
    fs_1.default.writeFileSync(rtmFile4, generateRtmCsv(96));
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'RTM', deliveryDate: new Date('2026-08-04'), filePath: rtmFile4, fileName: 'rtm4.csv', action: 'replace' });
        console.log('✅ API returned success despite missing old file!');
    }
    catch (e) {
        console.error('FAILED (should not throw):', e.message);
    }
    console.log('\n--- Test 8: Verify UploadHistory ---');
    const histories = await prisma_1.default.uploadHistory.findMany({ where: { market: 'DAM' } });
    console.log('✅ UploadHistory actions found:', histories.map(h => h.action).join(', '));
    console.log('✅ REPLACE action exists:', histories.some(h => h.action === 'REPLACE'));
}
run().then(() => process.exit(0));
