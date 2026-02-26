import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  deleteConversationById,
  getGroupMessages,
  getMessageOverview,
  getMessages,
  markConversationRead,
  postGroupMessage,
  postMessage,
} from '../controllers/messagesController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMessageOverview);
router.get('/group/:conversationId', getGroupMessages);
router.post('/group/:caregiverId', postGroupMessage);
router.get('/:conversationId', getMessages);

router.post('/:conversationId', postMessage);
router.post('/:conversationId/read', markConversationRead);
router.delete('/:conversationId', deleteConversationById);

export default router;
