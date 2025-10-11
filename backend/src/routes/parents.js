import { Router } from 'express';
import { getParents, postParent } from '../controllers/parentsController.js';

const router = Router();

router.get('/', getParents);
router.post('/', postParent);

export default router;
