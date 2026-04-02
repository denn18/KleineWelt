import { Router } from 'express';
import { deleteParent, getParentById, getParents, patchParent, postParent } from '../controllers/parentsController.js';

const router = Router();

router.get('/', getParents);
router.post('/', postParent);
router.get('/:id', getParentById);
router.patch('/:id', patchParent);
router.delete('/:id', deleteParent);

export default router;
