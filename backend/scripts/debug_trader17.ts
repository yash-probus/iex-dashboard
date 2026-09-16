import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SavingsCalculatorService } from '../src/modules/savings-calculator/savings-calculator.service';
import { SavingsCalculatorNewService } from '../src/modules/savings-calculator-new/savings-calculator-new.service';
import { TraderPerformanceService } from '../src/modules/trader-performance/trader-performance.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const oldService = app.get(SavingsCalculatorService);
  const newService = app.get(SavingsCalculatorNewService);
  const tpService = app.get(TraderPerformanceService);

  const entryId = '66d1cf98f02f83c180da1d0d'; // The one from my previous tests
  
  try {
      const oldRes = await oldService.calculateMarketDecision(entryId, '2026-08', 'latest');
      console.log("OLD Net Savings:", oldRes.netSavings);
      
      const newRes = await newService.calculateMarketDecision(entryId, '2026-08', 'latest');
      console.log("NEW Net Savings:", newRes.netSavings);
      
      const tpRes = await tpService.calculateMarketDecision(entryId, '2026-08', 'latest');
      console.log("TP Net Savings:", tpRes.netSavings);
  } catch (e) {
      console.error(e);
  }

  await app.close();
  process.exit(0);
}
run();
