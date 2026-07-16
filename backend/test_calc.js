require('ts-node').register();
const { SavingsCalculatorService } = require('./src/modules/savings-calculator/savings-calculator.service.ts');

async function run() {
  try {
    const res = await SavingsCalculatorService.calculateSavings("309d4795-1d30-45bd-bd1e-c78c6a8a81b3");
    console.log(Object.keys(res));
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run().then(() => process.exit(0));
