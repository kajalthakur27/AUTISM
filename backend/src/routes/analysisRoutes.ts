import { Router } from 'express';
import { analyzeChild, getScreenings, getScreeningById } from '../controllers/analysisController';

const router = Router();

router.post('/analyze', analyzeChild);
router.get('/screenings', getScreenings);
router.get('/screenings/:id', getScreeningById);

export default router;
