import fs from 'fs';
import path from 'path';
import { ProposalService } from '../src/modules/proposal/proposal.service';

async function test() {
  const service = new ProposalService();

  const dummyData = {
    client_name: 'TEST CLIENT',
    client_short_name: 'TEST',
    client_city: 'Delhi',
    end_month: 'June 2026',
    start_month: 'February 2026',
    duration: 'Five months',
    start_month_name: 'February',
    end_month_name: 'June',
    year: '2026',
    total_units: '5,00,000',
    total_savings: '10,00,000',
    sanctioned_load: '200',
    savings_percentage: '90%',
    utility_rate: '₹8.00',
    iex_rate: '₹5.00',
    monthly_savings: '₹2,00,000',
    rate_diff: '₹3.00'
  };

  try {
    console.log('Generating proposal with dummy data...');
    const buffer = await service.generateProposal(dummyData);
    
    const outPath = path.join(__dirname, '../assets/templates/test_output.docx');
    fs.writeFileSync(outPath, buffer);
    console.log(`Success! Generated test proposal at: ${outPath}`);
  } catch (error) {
    console.error('Error generating proposal:', error);
  }
}

test();
