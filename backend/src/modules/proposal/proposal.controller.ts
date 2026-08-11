import { Request, Response } from 'express';
import { ProposalService } from './proposal.service';

const proposalService = new ProposalService();

export class ProposalController {
  public async generate(req: Request, res: Response): Promise<void> {
    try {
      const clientData = req.body;
      const docBuffer = await proposalService.generateProposal(clientData, 'default');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=Proposal.docx');
      res.send(docBuffer);
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      res.status(500).json({ error: 'Failed to generate proposal' });
    }
  }

  public async generateTechnical(req: Request, res: Response): Promise<void> {
    try {
      const clientData = req.body;
      const docBuffer = await proposalService.generateProposal(clientData, 'technical');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=Technical_Proposal.docx');
      res.send(docBuffer);
    } catch (error: any) {
      console.error('Error generating technical proposal:', error);
      res.status(500).json({ error: 'Failed to generate technical proposal' });
    }
  }

  public async generateCommercial(req: Request, res: Response): Promise<void> {
    try {
      const clientData = req.body;
      const docBuffer = await proposalService.generateProposal(clientData, 'commercial');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename=Commercial_Proposal.docx');
      res.send(docBuffer);
    } catch (error: any) {
      console.error('Error generating commercial proposal:', error);
      res.status(500).json({ error: 'Failed to generate commercial proposal' });
    }
  }
}
