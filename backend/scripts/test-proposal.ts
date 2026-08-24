import fs from 'fs';
import path from 'path';
import { ProposalService } from '../src/modules/proposal/proposal.service';

async function test() {
  const service = new ProposalService();

  const dummyData = {
    client_name: 'TEST NPCL CLIENT',
    state: 'UP',
    discom_name: 'NPCL',
    voltage_level: '33 kV',
    feeder_type: 'Independent'
  };

  try {
    console.log('Generating commercial proposal for NPCL 33kV...');
    const buffer = await service.generateProposal(dummyData, 'commercial');
    
    const outPath = path.join(__dirname, '../assets/templates/test_output.docx');
    fs.writeFileSync(outPath, buffer);
    console.log(`Success! Generated test proposal at: ${outPath}`);
  } catch (error) {
    console.error('Error generating proposal:', error);
  }
}

test();
