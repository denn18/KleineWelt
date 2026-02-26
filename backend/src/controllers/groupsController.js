import {
  addContact,
  createGroup,
  leaveGroup,
  listContacts,
  listGroupMessages,
  listGroupsForUser,
  listParticipantSuggestions,
  markGroupRead,
  removeContact,
  sendGroupMessage,
  setMuteStatus,
  updateParticipants,
} from '../services/groupsService.js';

function handleError(res, error) {
  const status = error?.status || 500;
  return res.status(status).json({ message: error?.message || 'Unbekannter Fehler.' });
}

export async function getGroups(req, res) {
  try {
    const groups = await listGroupsForUser(req.user.id);
    res.json(groups);
  } catch (error) {
    handleError(res, error);
  }
}

export async function postGroup(req, res) {
  try {
    const group = await createGroup({ userId: req.user.id, participantIds: req.body?.participantIds });
    res.status(201).json(group);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getGroupMessages(req, res) {
  try {
    const payload = await listGroupMessages({ groupId: req.params.groupId, userId: req.user.id });
    res.json(payload);
  } catch (error) {
    handleError(res, error);
  }
}

export async function postGroupMessage(req, res) {
  try {
    const message = await sendGroupMessage({
      groupId: req.params.groupId,
      userId: req.user.id,
      body: req.body?.body,
      attachments: req.body?.attachments,
    });
    res.status(201).json(message);
  } catch (error) {
    handleError(res, error);
  }
}

export async function postGroupRead(req, res) {
  try {
    await markGroupRead({ groupId: req.params.groupId, userId: req.user.id });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function postGroupMute(req, res) {
  try {
    const group = await setMuteStatus({ groupId: req.params.groupId, userId: req.user.id, muted: Boolean(req.body?.muted) });
    res.json(group);
  } catch (error) {
    handleError(res, error);
  }
}

export async function postGroupLeave(req, res) {
  try {
    await leaveGroup({ groupId: req.params.groupId, userId: req.user.id });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function patchGroupParticipants(req, res) {
  try {
    const group = await updateParticipants({
      groupId: req.params.groupId,
      userId: req.user.id,
      addParentIds: req.body?.addParentIds || [],
      removeParentIds: req.body?.removeParentIds || [],
    });
    res.json(group);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getSuggestions(req, res) {
  try {
    const suggestions = await listParticipantSuggestions(req.user.id);
    res.json(suggestions);
  } catch (error) {
    handleError(res, error);
  }
}

export async function getContacts(req, res) {
  try {
    const contacts = await listContacts(req.user.id);
    res.json(contacts);
  } catch (error) {
    handleError(res, error);
  }
}

export async function putContact(req, res) {
  try {
    await addContact({ userId: req.user.id, parentId: req.params.parentId });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}

export async function deleteContact(req, res) {
  try {
    await removeContact({ userId: req.user.id, parentId: req.params.parentId });
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
}
