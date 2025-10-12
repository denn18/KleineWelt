import { Router } from 'express';
import { getParentById, getParents, patchParent, postParent } from '../controllers/parentsController.js';

const router = Router();

router.get('/', getParents);
router.post('/', postParent);
router.get('/:id', getParentById);
router.patch('/:id', patchParent);

export default router;
