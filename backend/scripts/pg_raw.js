const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT tablename FROM pg_tables WHERE schemaname = \'public\'');
  console.log(res.rows.map(r => r.tablename));
  const res2 = await client.query('SELECT * FROM "TraderPerformanceEntry" LIMIT 1');
  console.log(res2.rows.length);
  await client.end();
  process.exit(0);
}
run();
