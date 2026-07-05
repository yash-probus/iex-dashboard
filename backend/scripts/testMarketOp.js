"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const market_operations_service_1 = require("../src/modules/market-operations/market-operations.service");
async function test() {
    const service = new market_operations_service_1.MarketOperationsService();
    const res = await service.uploadRecords('../Untitled spreadsheet (1).xlsx');
    console.log(res);
}
test().catch(console.error);
