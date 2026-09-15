const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDates() {
  const query = `
    UPDATE "RtmRecord"
    SET "date" = SUBSTRING("date", 7, 4) || '-' || SUBSTRING("date", 4, 2) || '-' || SUBSTRING("date", 1, 2)
    WHERE "date" LIKE '%-%-%' AND LENGTH("date") = 10 AND SUBSTRING("date", 3, 1) = '-';
  `;
  const res1 = await prisma.$executeRawUnsafe(query);
  console.log('RTM records updated:', res1);

  const query2 = `
    UPDATE "DamRecord"
    SET "date" = SUBSTRING("date", 7, 4) || '-' || SUBSTRING("date", 4, 2) || '-' || SUBSTRING("date", 1, 2)
    WHERE "date" LIKE '%-%-%' AND LENGTH("date") = 10 AND SUBSTRING("date", 3, 1) = '-';
  `;
  const res2 = await prisma.$executeRawUnsafe(query2);
  console.log('DAM records updated:', res2);

  const query3 = `
    UPDATE "GdamRecord"
    SET "date" = SUBSTRING("date", 7, 4) || '-' || SUBSTRING("date", 4, 2) || '-' || SUBSTRING("date", 1, 2)
    WHERE "date" LIKE '%-%-%' AND LENGTH("date") = 10 AND SUBSTRING("date", 3, 1) = '-';
  `;
  const res3 = await prisma.$executeRawUnsafe(query3);
  console.log('GDAM records updated:', res3);
  
  const query4 = `
    UPDATE "GdamNewRecord"
    SET "date" = SUBSTRING("date", 7, 4) || '-' || SUBSTRING("date", 4, 2) || '-' || SUBSTRING("date", 1, 2)
    WHERE "date" LIKE '%-%-%' AND LENGTH("date") = 10 AND SUBSTRING("date", 3, 1) = '-';
  `;
  const res4 = await prisma.$executeRawUnsafe(query4);
  console.log('GDAM New records updated:', res4);

  const query5 = `
    UPDATE "RecRecord"
    SET "date" = SUBSTRING("date", 7, 4) || '-' || SUBSTRING("date", 4, 2) || '-' || SUBSTRING("date", 1, 2)
    WHERE "date" LIKE '%-%-%' AND LENGTH("date") = 10 AND SUBSTRING("date", 3, 1) = '-';
  `;
  const res5 = await prisma.$executeRawUnsafe(query5);
  console.log('REC records updated:', res5);
}

fixDates().catch(console.error).finally(() => prisma.$disconnect());
