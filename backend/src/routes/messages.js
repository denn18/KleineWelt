import { Router } from 'express';
import { getMessageOverview, getMessages, postMessage } from '../controllers/messagesController.js';

const router = Router();

router.get('/', getMessageOverview);
router.get('/:conversationId', getMessages);
router.post('/:conversationId', postMessage);

export default router;
