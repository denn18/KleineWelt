import { Router } from 'express';
import {
  deleteCareGroupController,
  getCareGroupController,
  upsertCareGroupController,
} from '../controllers/careGroupsController.js';

const router = Router();

router.get('/', getCareGroupController);
router.put('/', upsertCareGroupController);
router.delete('/:caregiverId', deleteCareGroupController);

export default router;
