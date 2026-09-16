const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query('SELECT id, client_name FROM trader_performance_entries');
  console.log("Total entries:", res.rows.length);
  res.rows.forEach(r => console.log(r.id, r.client_name));
  await client.end();
  process.exit(0);
}
run();
