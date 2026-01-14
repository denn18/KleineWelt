import { Router } from 'express';
import {
  getVapidPublicKeyResponse,
  sendTestPush,
  subscribeToPush,
  unsubscribeFromPush,
} from '../controllers/pushSubscriptionsController.js';

const router = Router();

router.post('/', subscribeToPush);
router.delete('/', unsubscribeFromPush);
router.get('/vapid-public-key', getVapidPublicKeyResponse);
router.post('/test', sendTestPush);

export default router;
