import { ProposalService } from './src/modules/proposal/proposal.service';

async function run() {
  const service = new ProposalService();
  const clientData = {
    client_name: 'TEST 33KV CLIENT',
    state: 'UP',
    discom_name: 'PUVVNL',
    connectivity: '33KV',
    sanctioned_load: '1500 kW',
    feeder_type: 'Dedicated',
  };

  try {
    const buf = await service.generateProposal(clientData, 'commercial');
    console.log("Proposal generated, size:", buf.length);
  } catch (err) {
    console.error(err);
  }
}

run();
