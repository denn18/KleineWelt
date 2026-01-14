import { Router } from 'express';
import { sendTestPush, subscribeToPush, unsubscribeFromPush } from '../controllers/pushSubscriptionsController.js';

const router = Router();

router.post('/', subscribeToPush);
router.delete('/', unsubscribeFromPush);
router.post('/test', sendTestPush);

export default router;
