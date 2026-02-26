import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  deleteContact,
  getContacts,
  getGroupMessages,
  getGroups,
  getSuggestions,
  patchGroupParticipants,
  postGroup,
  postGroupLeave,
  postGroupMessage,
  postGroupMute,
  postGroupRead,
  putContact,
} from '../controllers/groupsController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getGroups);
router.post('/', postGroup);
router.get('/suggestions', getSuggestions);
router.get('/contacts', getContacts);
router.put('/contacts/:parentId', putContact);
router.delete('/contacts/:parentId', deleteContact);
router.get('/:groupId/messages', getGroupMessages);
router.post('/:groupId/messages', postGroupMessage);
router.post('/:groupId/read', postGroupRead);
router.post('/:groupId/mute', postGroupMute);
router.post('/:groupId/leave', postGroupLeave);
router.patch('/:groupId/participants', patchGroupParticipants);

export default router;
