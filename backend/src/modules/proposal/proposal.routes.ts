import { Router } from 'express';
import { ProposalController } from './proposal.controller';

const router = Router();
const controller = new ProposalController();

router.post('/generate', controller.generate.bind(controller));
router.post('/generate-technical', controller.generateTechnical.bind(controller));
router.post('/generate-commercial', controller.generateCommercial.bind(controller));

export default router;
