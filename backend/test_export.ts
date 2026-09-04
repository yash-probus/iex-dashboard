import { SavingsCalculatorExportService } from './src/modules/savings-calculator/savings-calculator.export';
async function test() {
  try {
    const buffer = await SavingsCalculatorExportService.exportDemandShiftToExcel('copied-2-ee51-4187-8fa3-d71863c67cfa', 'all');
    console.log('Success! Buffer length:', buffer.length);
    process.exit(0);
  } catch (err) {
    console.error('ERROR OCCURRED:', err);
    process.exit(1);
  }
}
test();
