const { MongoClient } = require('mongodb');
async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('IEX_Dashboard');
  const collections = await db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  
  if (collections.some(c => c.name === 'trader_performances')) {
    const docs = await db.collection('trader_performances').find({}).toArray();
    console.log("trader_performances docs:", docs.length);
    if (docs.length > 0) {
      console.log(docs[0]._id, docs[0].clientName);
    }
  }
  await client.close();
}
run().catch(console.error);
