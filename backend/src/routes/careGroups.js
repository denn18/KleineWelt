import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  deleteOwnCareGroup,
  getOwnCareGroup,
  leaveOwnCareGroup,
  saveOwnCareGroup,
} from '../controllers/careGroupsController.js';

const router = Router();
router.use(requireAuth);

router.get('/me', getOwnCareGroup);
router.put('/me', saveOwnCareGroup);
router.delete('/me', deleteOwnCareGroup);
router.post('/me/leave', leaveOwnCareGroup);

export default router;
