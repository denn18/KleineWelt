import { Router } from 'express';
import { createPushSubscription, deletePushSubscription } from '../controllers/pushSubscriptionsController.js';

const router = Router();

router.post('/', createPushSubscription);
router.delete('/', deletePushSubscription);

export default router;
