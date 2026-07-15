import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  // Input units from bill (KVAH)
  const tod1 = 156026.8; // 05:00-11:00
  const tod2 = 168388.2; // 11:00-17:00
  const tod3 = 157317.0; // 17:00-23:00
  const tod4 = 153744.2; // 23:00-05:00
  
  // Find UP tariffs for HV-2
  const tariffs = await prisma.stateTariff.findMany({
    where: { state: 'Uttar Pradesh', consumerCategory: 'HV-2' }
  });
  
  // Group by TOD for a specific month (e.g. 202604 as representative)
  const aprilTariffs = tariffs.filter(t => t.month === 202604);
  console.log("April Tariffs HV-2:", aprilTariffs.map(t => ({
    start: t.todStartTime,
    end: t.todEndTime,
    rate: Number(t.energyRate),
    subcat: t.subCategory,
    voltage: t.supplyVoltageCategory
  })));
  
  // Pick a specific subcategory/voltage to calculate
  const specificTariffs = aprilTariffs.filter(t => t.supplyVoltageCategory === 'At 11 kV' && t.subCategory.includes('Large & Heavy'));
  
  if (specificTariffs.length > 0) {
    let totalCost = 0;
    
    // We will match the TOD times manually for demonstration
    // Note: UP HV-2 usually has:
    // 05:00-11:00 (Normal - 0%)
    // 11:00-17:00 (Normal - 0%)
    // 17:00-23:00 (Peak - +15%)
    // 23:00-05:00 (Offpeak - -15% or -7.5%)
    
    for (const t of specificTariffs) {
      if (t.todStartTime === '05:00' && t.todEndTime === '11:00') {
        totalCost += tod1 * Number(t.energyRate);
        console.log(`TOD 05-11: ${tod1} * ${t.energyRate} = ${tod1 * Number(t.energyRate)}`);
      }
      else if (t.todStartTime === '11:00' && t.todEndTime === '17:00') {
        totalCost += tod2 * Number(t.energyRate);
        console.log(`TOD 11-17: ${tod2} * ${t.energyRate} = ${tod2 * Number(t.energyRate)}`);
      }
      else if (t.todStartTime === '17:00' && t.todEndTime === '23:00') {
        totalCost += tod3 * Number(t.energyRate);
        console.log(`TOD 17-23: ${tod3} * ${t.energyRate} = ${tod3 * Number(t.energyRate)}`);
      }
      else if (t.todStartTime === '23:00' && t.todEndTime === '05:00') {
        totalCost += tod4 * Number(t.energyRate);
        console.log(`TOD 23-05: ${tod4} * ${t.energyRate} = ${tod4 * Number(t.energyRate)}`);
      }
    }
    console.log(`Calculated Total Energy Cost: ${totalCost}`);
    console.log(`Bill Energy Charges: 4513255.09`);
    console.log(`Difference: ${Math.abs(totalCost - 4513255.09)}`);
  }
}
run();
