import { Router } from 'express';
import {
  deleteConversationById,
  getMessageOverview,
  getMessages,
  markConversationRead,
  postMessage,
} from '../controllers/messagesController.js';

const router = Router();

router.get('/', getMessageOverview);
router.get('/:conversationId', getMessages);
router.post('/:conversationId', postMessage);
router.post('/:conversationId/read', markConversationRead);
router.delete('/:conversationId', deleteConversationById);

export default router;
