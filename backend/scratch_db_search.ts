import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  console.log("Searching user_details...");
  const users = await prisma.user_details.findMany({
    where: {
      OR: [
        { factory_name: { contains: 'SSN', mode: 'insensitive' } },
        { factory_name: { contains: 'Mayank', mode: 'insensitive' } },
        { factory_name: { contains: 'Maheshwari', mode: 'insensitive' } },
        { contact_person_name: { contains: 'SSN', mode: 'insensitive' } },
        { contact_person_name: { contains: 'Mayank', mode: 'insensitive' } },
        { contact_person_name: { contains: 'Maheshwari', mode: 'insensitive' } }
      ]
    }
  });
  console.log("Found in user_details:", users);

  console.log("Searching savingsCalculatorEntry...");
  const oldEntries = await prisma.savingsCalculatorEntry.findMany({
    where: {
      OR: [
        { clientName: { contains: 'SSN', mode: 'insensitive' } },
        { clientName: { contains: 'Mayank', mode: 'insensitive' } },
        { clientName: { contains: 'Maheshwari', mode: 'insensitive' } }
      ]
    }
  });
  console.log("Found in savingsCalculatorEntry:", oldEntries.map(e => ({ id: e.id, clientName: e.clientName })));

  console.log("Searching savingsCalculatorNewEntry...");
  const newEntries = await prisma.savingsCalculatorNewEntry.findMany({
    where: {
      OR: [
        { clientName: { contains: 'SSN', mode: 'insensitive' } },
        { clientName: { contains: 'Mayank', mode: 'insensitive' } },
        { clientName: { contains: 'Maheshwari', mode: 'insensitive' } }
      ]
    }
  });
  console.log("Found in savingsCalculatorNewEntry:", newEntries.map(e => ({ id: e.id, clientName: e.clientName })));

  process.exit(0);
}

run().catch(console.error);
