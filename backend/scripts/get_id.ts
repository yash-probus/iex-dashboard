import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const TraderPerformanceSchema = new mongoose.Schema({
  clientName: String,
  todConsumptions: mongoose.Schema.Types.Mixed
}, { strict: false });
const TraderPerformance = mongoose.model('TraderPerformance', TraderPerformanceSchema, 'trader_performances');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/IEX_Dashboard');
  const docs = await TraderPerformance.find({});
  docs.forEach(d => console.log(d._id, d.clientName));
  process.exit(0);
}
run();
