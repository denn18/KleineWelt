import { Router } from 'express';
import { getMessages, postMessage } from '../controllers/messagesController.js';

const router = Router();

router.get('/:conversationId', getMessages);
router.post('/:conversationId', postMessage);

export default router;
