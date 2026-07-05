import { MarketOperationsService } from '../src/modules/market-operations/market-operations.service';

async function test() {
  const service = new MarketOperationsService();
  const res = await service.uploadRecords('../Untitled spreadsheet (1).xlsx');
  console.log(res);
}

test().catch(console.error);
