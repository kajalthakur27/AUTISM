import { Router } from 'express';
import { analyzeChild } from '../controllers/analysisController';

const router = Router();

router.post('/analyze', analyzeChild);

export default router;
