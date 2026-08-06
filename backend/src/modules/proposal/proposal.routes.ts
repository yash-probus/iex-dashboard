import { Router } from 'express';
import { ProposalController } from './proposal.controller';

const router = Router();
const controller = new ProposalController();

router.post('/generate', controller.generate.bind(controller));

export default router;
