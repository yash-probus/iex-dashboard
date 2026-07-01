import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import https from 'https';

const prisma = new PrismaClient();
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function seedIstsCharges() {
  try {
    const response = await axios.post('https://webapi.grid-india.in/api/v1/file', {
      _source: 'GRDW',
      _type: 'TRANSMISSION_LOSSES',
      _fileDate: '',
      _month: ''
    }, { httpsAgent });

    const data = response.data?.retData;
    if (!data || !Array.isArray(data)) {
      console.log('No ISTS charges (transmission losses) data found from API.');
      return;
    }

    let inserted = 0;
    for (const item of data) {
      if (item.FileType === 'TRANSMISSION_LOSSES' && item.Title_) {
        // Example title: "20262906-0507" or "20251512-2112"
        // Sometimes it can be different, so let's try to parse it.
        const titleMatch = item.Title_.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/);
        
        if (titleMatch) {
          const yearStr = titleMatch[1];
          const startDay = titleMatch[2];
          const startMonth = titleMatch[3];
          const endDay = titleMatch[4];
          const endMonth = titleMatch[5];
          
          const year = parseInt(yearStr);
          
          // Construct dates (JS Date months are 0-indexed, but strings like '2026-06-29' are 1-indexed)
          const weekStart = new Date(`${year}-${startMonth}-${startDay}T00:00:00Z`);
          
          // If the month rolls over (e.g., start 2906, end 0507), year remains the same unless it's Dec-Jan
          let endYear = year;
          if (startMonth === '12' && endMonth === '01') {
            endYear = year + 1;
          }
          const weekEnd = new Date(`${endYear}-${endMonth}-${endDay}T00:00:00Z`);
          
          if (!isNaN(weekStart.getTime()) && !isNaN(weekEnd.getTime())) {
            const pdfUrl = `https://webcdn.grid-india.in/${item.FilePath}`;
            
            try {
              await prisma.istsChargeDocs.upsert({
                where: {
                  weekStart_weekEnd_year: {
                    weekStart,
                    weekEnd,
                    year
                  }
                },
                update: { pdfUrl },
                create: {
                  weekStart,
                  weekEnd,
                  year,
                  pdfUrl
                }
              });
              inserted++;
            } catch (e: any) {
              console.log(`Failed inserting ISTS record ${item.Title_}: ${e.message}`);
            }
          }
        } else {
           // Maybe try falling back to Field2 if Title doesn't match?
           console.log(`Could not parse title format for: ${item.Title_}`);
        }
      }
    }
    
    console.log(`Successfully inserted/updated ${inserted} ISTS charge docs.`);
  } catch (error: any) {
    console.error('Error fetching ISTS charges:', error.message);
  }
}

if (require.main === module) {
  seedIstsCharges().catch(console.error).finally(() => prisma.$disconnect());
}
