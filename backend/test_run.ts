import mongoose from 'mongoose';
import { TraderPerformanceService } from './src/modules/trader-performance/trader-performance.service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/IEX_Dashboard');
    const res = await TraderPerformanceService.calculateMarketDecision('66d1cf98f02f83c180da1d0d', 'all');
    console.log("totalTraderMarketEnergy:", res.totalTraderMarketEnergy);
    console.log("totalTraderLandedCost:", res.totalTraderLandedCost);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
