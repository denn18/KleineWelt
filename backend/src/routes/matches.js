import { Router } from 'express';
import { getMatchHistory, getMatches, postMatch } from '../controllers/matchesController.js';

const router = Router();

router.get('/', getMatches);
router.post('/', postMatch);
router.get('/history', getMatchHistory);

export default router;
