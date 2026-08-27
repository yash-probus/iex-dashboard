import { ProposalService } from './src/modules/proposal/proposal.service';

const service = new ProposalService();
service.generateProposal({}, 'technical').then(() => console.log('success')).catch(e => console.error('Error:', e));
