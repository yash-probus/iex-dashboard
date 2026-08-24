import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("Crawling database...");
  
  // Get all tables in public schema
  const tables: any[] = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  
  console.log("Tables found:", tables.map(t => t.table_name));

  for (const t of tables) {
    const tableName = t.table_name;
    try {
      // Find columns that are of character/text type
      const cols: any[] = await prisma.$queryRawUnsafe(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = '${tableName}' AND data_type IN ('character varying', 'text')
      `);
      
      if (cols.length === 0) continue;
      
      const colNames = cols.map(c => c.column_name);
      
      // Build a query to search these columns for 'SSN' or 'Mayank'
      const orClauses = colNames.map(c => `"${c}" ILIKE '%SSN%' OR "${c}" ILIKE '%Mayank%'`).join(' OR ');
      if (!orClauses) continue;
      
      const searchQ = `SELECT * FROM "${tableName}" WHERE ${orClauses}`;
      const results: any[] = await prisma.$queryRawUnsafe(searchQ);
      if (results.length > 0) {
        console.log(`FOUND in table: ${tableName}`);
        console.log(results.map(r => {
          // just print id, name/client_name, etc.
          const summary: any = {};
          if (r.id) summary.id = r.id;
          if (r.client_name) summary.client_name = r.client_name;
          if (r.clientName) summary.clientName = r.clientName;
          if (r.industry_name) summary.industry_name = r.industry_name;
          if (r.industryName) summary.industryName = r.industryName;
          if (r.factory_name) summary.factory_name = r.factory_name;
          return { ...summary, raw: r };
        }));
      }
    } catch (err: any) {
      console.error(`Error querying table ${tableName}:`, err.message);
    }
  }

  process.exit(0);
}

run().catch(console.error);
