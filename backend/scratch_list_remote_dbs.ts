import { PrismaClient } from '@prisma/client';

async function run() {
  const url = 'postgresql://postgres:iex_sec_k9P2mX_2026@13.206.77.155:5432/postgres';
  console.log("Connecting to remote postgres DB to list all databases:", url);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url
      }
    }
  });

  try {
    const dbs: any[] = await prisma.$queryRaw`SELECT datname FROM pg_database WHERE datistemplate = false`;
    console.log("Databases on 13.206.77.155:", dbs.map(d => d.datname));
  } catch (err: any) {
    console.error("Error listing remote databases:", err.message);
  } finally {
    await prisma.$disconnect();
  }
  process.exit(0);
}

run();
