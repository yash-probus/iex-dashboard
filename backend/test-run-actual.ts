import { TraderPerformanceActualExportService } from './src/modules/trader-performance-actual/trader-performance-actual.export';

async function main() {
  const id = '2c0bb9b2-ee51-4187-8fa3-d71863c67cfa';
  console.log("Generating Excel for", id);
  await TraderPerformanceActualExportService.exportActualTraderToExcel(id, 'all', 1);
  console.log("Done");
}
main().catch(console.error);
