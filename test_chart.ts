import { ChartGeneratorService } from './backend/src/modules/proposal/chartGenerator.service';
import fs from 'fs';

async function run() {
    const buffer = await ChartGeneratorService.generateSavingsChart([
        { month_name: 'Jan-25', saving: '₹1,00,000' }
    ], '1,00,000', 'One lakh');
    fs.writeFileSync('test_chart.png', buffer);
    console.log('Chart generated successfully, size:', buffer.length);
}
run().catch(console.error);
