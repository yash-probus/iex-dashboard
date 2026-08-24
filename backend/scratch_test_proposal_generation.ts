import { PrismaClient } from '@prisma/client';
import { ProposalService } from './src/modules/proposal/proposal.service';
import fs from 'fs';

const prisma = new PrismaClient();
const proposalService = new ProposalService();

async function run() {
  const entries = await prisma.savingsCalculatorNewEntry.findMany({ take: 1, orderBy: { createdAt: 'desc' } });
  if (entries.length === 0) return;
  const entry = entries[0];
  console.log("Testing proposal generation for entry:", entry.id);

  try {
    const data = {
      client_name: entry.clientName,
      industry_name: entry.industryName,
      connectivity: entry.voltageLevel || '11 kV',
      sanctioned_load: entry.sanctionedLoadKw,
      discom_name: entry.discom
    };
    
    const buffer = await proposalService.generateProposal(data, 'commercial');
    fs.writeFileSync('test_proposal.docx', buffer);
    console.log("Proposal generated successfully: test_proposal.docx");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
