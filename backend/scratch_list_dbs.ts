import { PrismaClient } from '@prisma/client';

async function run() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:postgres@localhost:5432/postgres'
      }
    }
  });

  try {
    const dbs: any[] = await prisma.$queryRaw`SELECT datname FROM pg_database WHERE datistemplate = false`;
    console.log("Databases on localhost:5432 (postgres/postgres):", dbs.map(d => d.datname));
  } catch (err: any) {
    console.log("Failed with postgres/postgres:", err.message);
  } finally {
    await prisma.$disconnect();
  }

  const prisma2 = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:iex_sec_k9P2mX_2026@localhost:5432/postgres'
      }
    }
  });

  try {
    const dbs: any[] = await prisma2.$queryRaw`SELECT datname FROM pg_database WHERE datistemplate = false`;
    console.log("Databases on localhost:5432 (postgres/iex_sec_k9P2mX_2026):", dbs.map(d => d.datname));
  } catch (err: any) {
    console.log("Failed with postgres/iex_sec_k9P2mX_2026:", err.message);
  } finally {
    await prisma2.$disconnect();
  }

  process.exit(0);
}

run();
