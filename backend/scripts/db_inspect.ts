import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const TraderPerformanceSchema = new mongoose.Schema({
  todConsumptions: mongoose.Schema.Types.Mixed
}, { strict: false });
const TraderPerformance = mongoose.model('TraderPerformance', TraderPerformanceSchema, 'trader_performances');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/IEX_Dashboard');
  const doc = await TraderPerformance.findById('66d1cf98f02f83c180da1d0d');
  if (doc && doc.todConsumptions && doc.todConsumptions['2026-08'] && doc.todConsumptions['2026-08'].traderReports) {
    const reports = doc.todConsumptions['2026-08'].traderReports.data;
    const firstDate = Object.keys(reports)[0];
    console.log("Date:", firstDate);
    console.log("First trade:", reports[firstDate].trades[0]);
  }
  process.exit(0);
}
run();
