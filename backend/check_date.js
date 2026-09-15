require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/IEX_Dashboard');
  const collection = mongoose.connection.collection('trader_performances');
  const doc = await collection.findOne({});
  if (doc && doc.todConsumptions) {
    const month = Object.keys(doc.todConsumptions)[0];
    const slots = doc.todConsumptions[month].slots;
    console.log("Slot date:", slots[0].date);
  }
  process.exit(0);
}
run();
