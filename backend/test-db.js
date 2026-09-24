const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
    const data = await prisma.dataset.findFirst({
        where: { market: 'DAM', deliveryDate: new Date('2026-09-24T00:00:00Z') }
    });
    console.log('24 Sep:', data);
    
    const logs = await prisma.apiLog.findMany({
        where: { apiName: 'IEX DAM Scraper' },
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    console.log('Logs:', logs);
    
    process.exit(0);
})();
