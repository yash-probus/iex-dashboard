const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { SavingsCalculatorExportService } = require('./dist/modules/savings-calculator/savings-calculator.export');
const fs = require('fs');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // Find a savings calculator entry id
  const { PrismaService } = require('./dist/prisma/prisma.service');
  const prisma = app.get(PrismaService);
  const entry = await prisma.savingsCalculatorEntry.findFirst({
    where: { clientName: { not: null } },
    orderBy: { createdAt: 'desc' }
  });
  if (entry) {
    console.log('Testing with entry:', entry.id);
    const buffer = await SavingsCalculatorExportService.exportToExcel(entry.id, 'all');
    fs.writeFileSync('test_export.xlsx', buffer);
    console.log('Exported to test_export.xlsx');
  } else {
    console.log('No entry found');
  }
  await app.close();
}
test().catch(console.error);
