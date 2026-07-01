import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOneMonthNpp() {
  const endDate = new Date(); // today
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  console.log(`Clearing existing NPP data...`);
  await prisma.nppRawDemandData.deleteMany({});
  
  console.log(`Seeding exact NPP data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

  let current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const url = `https://npp.gov.in/dashBoard/demandmet1chartdata?date=${dateStr}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log(`No data for ${dateStr}`);
        current.setDate(current.getDate() + 1);
        continue;
      }

      const dataToInsert = data.map((item: any) => {
        // item.updated_on is timestamp in ms, e.g., 1782844413000
        const d = new Date(item.updated_on);
        
        // The timestamp from the API is likely in IST, but since the Date object parses it as UTC epoch,
        // we extract the HH:MM locally for the string label
        // However, Node server timezone might differ. 
        // We know that new Date(epoch) gives a JS Date object. 
        // We need the local time string since the API is serving Indian Standard Time (IST).
        
        // A robust way to get IST time string "HH:MM"
        const formatter = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        const timeStr = formatter.format(d);
        
        return {
          date: dateStr,
          timeStr: timeStr,
          demandMet: Number(item.value_of_data) || 0,
          dataUpdatedAt: new Date(item.updated_on).toISOString(),
          fetchedAt: new Date(),
        };
      });

      await prisma.nppRawDemandData.createMany({
        data: dataToInsert,
        skipDuplicates: true
      });
      
      console.log(`Inserted ${dataToInsert.length} records for ${dateStr}`);
    } catch (err: any) {
      console.error(`Failed to fetch for ${dateStr}: ${err.message}`);
    }
    
    current.setDate(current.getDate() + 1);
  }

  console.log('Done seeding 1 month of exact NPP data.');
}

seedOneMonthNpp()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
