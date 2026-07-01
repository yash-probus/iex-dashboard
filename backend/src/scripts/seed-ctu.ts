import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import https from 'https';

const prisma = new PrismaClient();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

export async function seedCtuCharges() {
  try {
    const response = await axios.post('https://webapi.grid-india.in/api/v1/file', {
      _source: 'GRDW',
      _type: 'NOTIFICATION_TRANSMISSION_CHARGES',
      _fileDate: '',
      _month: ''
    }, { httpsAgent });

    const data = response.data?.retData;
    if (!data || !Array.isArray(data)) {
      console.log('No CTU charges data found from API.');
      return;
    }

    let inserted = 0;
    for (const item of data) {
      if (item.FileType === 'NOTIFICATION_TRANSMISSION_CHARGES') {
        const match = item.Title_.match(/month of ([A-Za-z]+),?\s*(\d{4})/i) || item.Title_.match(/month ([A-Za-z]+)\s*(\d{4})/i) || item.Title_.match(/month of ([A-Za-z]+)\s*(\d{4})/i) || item.Title_.match(/month ([A-Za-z]+),?\s*(\d{4})/i) || item.Title_.match(/for ([A-Za-z]+)\s*(\d{4}) Billing/i);
        
        let monthStr = '';
        let year = 0;

        if (match) {
          monthStr = match[1];
          year = parseInt(match[2]);
        } else {
          const dateMatch = item.Title_.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*'?\s*(\d{2,4})/i);
          if (dateMatch) {
              monthStr = dateMatch[1];
              year = parseInt(dateMatch[2]);
              if (year < 100) year += 2000;
          }
        }

        if (monthStr && year) {
          const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
          const monthIndex = monthNames.findIndex(m => monthStr.toLowerCase().startsWith(m)) + 1;
          
          if (monthIndex > 0) {
             const pdfUrl = `https://webcdn.grid-india.in/${item.FilePath}`;
             
             try {
                 await prisma.ctuCharges.upsert({
                   where: {
                     month_year: {
                       month: monthIndex,
                       year: year
                     }
                   },
                   update: { pdfUrl },
                   create: {
                     month: monthIndex,
                     year: year,
                     pdfUrl: pdfUrl
                   }
                 });
                 inserted++;
             } catch (e: any) {
                 console.log(`Failed inserting ${monthIndex}/${year}: ${e.message}`);
             }
          }
        }
      }
    }
    
    console.log(`Successfully inserted/updated ${inserted} CTU charge records.`);
  } catch (error: any) {
    console.error('Error fetching CTU charges:', error.message);
  }
}

if (require.main === module) {
  seedCtuCharges().catch(console.error).finally(() => prisma.$disconnect());
}
