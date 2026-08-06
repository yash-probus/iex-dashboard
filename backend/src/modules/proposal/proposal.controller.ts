import { Request, Response } from 'express';
import { ProposalService } from './proposal.service';

const proposalService = new ProposalService();

export class ProposalController {
  public async generate(req: Request, res: Response): Promise<void> {
    try {
      const clientData = req.body;
      const docBuffer = await proposalService.generateProposal(clientData);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=Proposal.docx');
      res.send(docBuffer);
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      res.status(500).json({ error: 'Failed to generate proposal' });
    }
  }
}
