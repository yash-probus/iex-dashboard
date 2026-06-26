import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Uniqueness Analysis ---');
  
  // Region State
  const regionStates = await prisma.regionState.findMany();
  console.log(`RegionState count: ${regionStates.length}`);
  const rsNames = new Set(regionStates.map(r => r.stateName));
  const rsCodes = new Set(regionStates.map(r => r.stateCode));
  console.log(`Unique stateNames: ${rsNames.size}, Unique stateCodes: ${rsCodes.size}`);
  console.log('RegionStates data:', regionStates);
  
  // Discom List
  const discoms = await prisma.discomList.findMany();
  console.log(`DiscomList count: ${discoms.length}`);
  const discomCodes = new Set(discoms.map(d => d.code));
  const discomNames = new Set(discoms.map(d => d.legalName));
  console.log(`Unique codes: ${discomCodes.size}, Unique legalNames: ${discomNames.size}`);

  // Month fields
  const iexFees = await prisma.iexFees.findFirst();
  const ctuCharges = await prisma.ctuCharges.findFirst();
  const stuCharges = await prisma.stuCharges.findFirst();
  const stateTariff = await prisma.stateTariff.findFirst();
  const proltMargin = await prisma.proltMargin.findFirst();
  
  console.log('--- Month Formats ---');
  console.log('IexFees:', iexFees?.month);
  console.log('CtuCharges:', ctuCharges?.month);
  console.log('StuCharges:', stuCharges?.month);
  console.log('StateTariff:', stateTariff?.month);
  console.log('ProltMargin:', proltMargin?.month);

  // State Tariff columns
  const tariffRows = await prisma.stateTariff.findMany({ take: 100 });
  console.log(`Sample Tariff rows: ${tariffRows.length}`);
  if (tariffRows.length > 0) {
    console.log('First Tariff:', JSON.stringify(tariffRows[0], null, 2));
  }

  // STU Charges columns
  const stuRows = await prisma.stuCharges.findMany({ take: 100 });
  console.log(`Sample STU rows: ${stuRows.length}`);
  if (stuRows.length > 0) {
    console.log('First STU:', JSON.stringify(stuRows[0], null, 2));
  }
}

run()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
