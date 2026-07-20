import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function calculateIntervalTime(intervalNumber: number): string {
    const totalMinutes = (intervalNumber - 1) * 15;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');

    return `${hh}:${mm}`;
}

async function main() {
    console.log("Fetching DamRecords...");
    const damRecords = await prisma.damRecord.findMany({ select: { id: true, intervalNumber: true } });
    for (const record of damRecords) {
        await prisma.damRecord.update({
            where: { id: record.id },
            data: { intervalTime: calculateIntervalTime(record.intervalNumber) }
        });
    }
    console.log(`Updated ${damRecords.length} DamRecords.`);

    console.log("Fetching GdamRecords...");
    const gdamRecords = await prisma.gdamRecord.findMany({ select: { id: true, intervalNumber: true } });
    for (const record of gdamRecords) {
        await prisma.gdamRecord.update({
            where: { id: record.id },
            data: { intervalTime: calculateIntervalTime(record.intervalNumber) }
        });
    }
    console.log(`Updated ${gdamRecords.length} GdamRecords.`);

    console.log("Fetching RtmRecords...");
    const rtmRecords = await prisma.rtmRecord.findMany({ select: { id: true, intervalNumber: true } });
    for (const record of rtmRecords) {
        await prisma.rtmRecord.update({
            where: { id: record.id },
            data: { intervalTime: calculateIntervalTime(record.intervalNumber) }
        });
    }
    console.log(`Updated ${rtmRecords.length} RtmRecords.`);

    console.log("Fetching RecRecords...");
    const recRecords = await prisma.recRecord.findMany({ select: { id: true, intervalNumber: true } });
    for (const record of recRecords) {
        await prisma.recRecord.update({
            where: { id: record.id },
            data: { intervalTime: calculateIntervalTime(record.intervalNumber) }
        });
    }
    console.log(`Updated ${recRecords.length} RecRecords.`);
    
    console.log("Fetching StateMarketRecords...");
    const smRecords = await prisma.stateMarketRecord.findMany({ select: { id: true, intervalNumber: true } });
    for (const record of smRecords) {
        await prisma.stateMarketRecord.update({
            where: { id: record.id },
            data: { intervalTime: calculateIntervalTime(record.intervalNumber) }
        });
    }
    console.log(`Updated ${smRecords.length} StateMarketRecords.`);

}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
