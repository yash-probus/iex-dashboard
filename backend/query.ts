const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getChanges = (current: any, previous: any) => {
  if (!previous) return [];
  const changes: any[] = [];
  const fields = [
    { key: 'clientName', label: 'Client' },
    { key: 'industryName', label: 'Industry' },
    { key: 'address', label: 'Address' },
    { key: 'stateCode', label: 'State' },
    { key: 'discom', label: 'Discom' },
    { key: 'consumerCategory', label: 'Category' },
    { key: 'voltageLevel', label: 'Voltage' },
    { key: 'sanctionedLoadKw', label: 'Load (kW)' },
    { key: 'proltMargin', label: 'PROLT Margin' },
    { key: 'traderMargin', label: 'Trader Margin' },
    { key: 'consultancyFee', label: 'Consultancy Fee' },
    { key: 'probusPlatformFee', label: 'Platform Fee' },
    { key: 'applyElectricityDuty', label: 'Electricity Duty' },
    { key: 'billedDemandKv', label: 'Billed Demand (kV)' },
    { key: 'powerFactor', label: 'Power Factor' },
    { key: 'arrearAmount', label: 'Arrear Amount' },
    { key: 'currentLpsc', label: 'Current LPSC' }
  ];

  fields.forEach(f => {
    if (current[f.key] !== previous[f.key]) {
      changes.push({
        label: f.label,
        old: previous[f.key],
        new: current[f.key]
      });
    }
  });

  return changes;
};

async function main() {
  const history = await prisma.savingsCalculatorEntryHistory.findMany({
    where: { entryId: 'fade3c79-434c-4faf-a5aa-5dd45edd1306' },
    orderBy: { version: 'asc' }
  });
  console.log('History versions found:', history.map((h: any) => h.version));
  if (history.length >= 2) {
    const v1 = history[0];
    const v2 = history[1];
    const changes = getChanges(v2, v1);
    console.log('Changes from V1 to V2:', changes);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
