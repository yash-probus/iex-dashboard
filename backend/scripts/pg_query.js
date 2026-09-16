const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const res = await client.query('SELECT id, client_name, tod_consumptions FROM "TraderPerformanceEntry" LIMIT 5');
  console.log("Found:", res.rows.length);
  res.rows.forEach(r => {
    console.log(r.id, r.client_name);
    if (r.client_name.includes('Yash') || true) {
      fs.writeFileSync('trader_debug.json', JSON.stringify(r.tod_consumptions, null, 2));
      console.log('Saved to trader_debug.json');
    }
  });
  await client.end();
  process.exit(0);
}
run();
