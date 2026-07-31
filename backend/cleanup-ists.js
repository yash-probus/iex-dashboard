const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  const allCharges = await prisma.istsCharges.findMany({
    orderBy: { id: 'asc' }
  });

  const seen = new Set();
  const toDelete = [];

  for (const charge of allCharges) {
    const key = `${charge.startDate.toISOString()}-${charge.endDate.toISOString()}`;
    if (seen.has(key)) {
      toDelete.push(charge.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} duplicate ISTS charges...`);
    await prisma.istsCharges.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log('Duplicates deleted successfully.');
  } else {
    console.log('No exact duplicates found based on startDate and endDate.');
  }
}

cleanupDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
