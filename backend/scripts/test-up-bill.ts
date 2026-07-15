import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  // Input units from bill
  const tod1 = 156026.8; // 05-11
  const tod2 = 168388.2; // 11-17
  const tod3 = 157317.0; // 17-23
  const tod4 = 153744.2; // 23-05
  
  // Find UP tariffs
  const tariffs = await prisma.stateTariff.findMany({
    where: { state: 'UTTAR PRADESH' }
  });
  
  console.log("Found Tariffs:", tariffs);
}
run();
