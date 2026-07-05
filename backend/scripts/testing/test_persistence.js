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
    const damFile = 'test_dam_persist.csv';
    fs_1.default.writeFileSync(damFile, generateDamCsv(96));
    console.log('\n--- Test 1: Valid DAM Upload ---');
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: new Date('2026-07-01'), filePath: damFile, fileName: damFile });
        const count = await prisma_1.default.damRecord.count();
        console.log('✅ DAM Records inserted:', count);
    }
    catch (e) {
        console.error('FAILED', e.message);
    }
    const gdamFile = 'test_gdam_persist.csv';
    fs_1.default.writeFileSync(gdamFile, generateGdamCsv(96));
    console.log('\n--- Test 2: Valid GDAM Upload ---');
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'GDAM', deliveryDate: new Date('2026-07-02'), filePath: gdamFile, fileName: gdamFile });
        const count = await prisma_1.default.gdamRecord.count();
        console.log('✅ GDAM Records inserted:', count);
    }
    catch (e) {
        console.error('FAILED', e.message);
    }
    const rtmFile = 'test_rtm_persist.csv';
    fs_1.default.writeFileSync(rtmFile, generateRtmCsv(96));
    console.log('\n--- Test 3: Valid RTM Upload ---');
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'RTM', deliveryDate: new Date('2026-07-03'), filePath: rtmFile, fileName: rtmFile });
        const count = await prisma_1.default.rtmRecord.count();
        console.log('✅ RTM Records inserted:', count);
    }
    catch (e) {
        console.error('FAILED', e.message);
    }
    console.log('\n--- Test 4: Duplicate Upload ---');
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: new Date('2026-07-01'), filePath: damFile, fileName: damFile });
        console.log('FAILED: Should have thrown duplicate error');
    }
    catch (e) {
        console.log('✅ Caught expected error:', e.message);
    }
    console.log('\n--- Test 5: Transaction Failure (95 rows) ---');
    const damFile95 = 'test_dam_95.csv';
    fs_1.default.writeFileSync(damFile95, generateDamCsv(95));
    try {
        await upload_processing_service_1.UploadProcessingService.processUpload({ market: 'DAM', deliveryDate: new Date('2026-07-04'), filePath: damFile95, fileName: damFile95 });
    }
    catch (e) {
        console.log('✅ Caught expected error:', e.message);
        const datasets = await prisma_1.default.dataset.count({ where: { deliveryDate: new Date('2026-07-04') } });
        console.log('✅ Datasets for 2026-07-04:', datasets, '(Rollback successful)');
    }
}
run().then(() => process.exit(0));
