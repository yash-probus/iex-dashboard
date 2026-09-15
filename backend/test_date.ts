import mongoose from 'mongoose';
import { TraderPerformanceModel } from './src/modules/trader-performance/trader-performance.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/IEX_Dashboard');
  const entry = await TraderPerformanceModel.findOne({});
  if (entry && entry.todConsumptions) {
    const month = Object.keys(entry.todConsumptions)[0];
    const slots = entry.todConsumptions[month].slots;
    console.log("Slot date format:", slots[0].date);
  }
  process.exit(0);
}
check();
