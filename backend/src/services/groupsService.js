import {
  caregiverContactsCollection,
  ensureGroupIndexes,
  groupMessagesCollection,
  groupsCollection,
  serializeGroup,
  serializeGroupMessage,
  toObjectId,
} from '../models/Group.js';
import { caregiversCollection, serializeCaregiver } from '../models/Caregiver.js';
import { parentsCollection, serializeParent } from '../models/Parent.js';
import { messagesCollection } from '../models/Message.js';
import { storeBase64File } from '../utils/fileStorage.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function forbidden(message = 'Du hast keine Berechtigung.') {
  const error = new Error(message);
  error.status = 403;
  return error;
}

function notFound(message = 'Nicht gefunden.') {
  const error = new Error(message);
  error.status = 404;
  return error;
}

async function enrichParents(parentIds) {
  if (!parentIds.length) {
    return [];
  }
  const objectIds = parentIds.map(toObjectId).filter(Boolean);
  const docs = await parentsCollection().find({ _id: { $in: objectIds } }).toArray();
  const byId = new Map(docs.map((doc) => [doc._id.toString(), serializeParent(doc)]));
  return parentIds.map((id) => byId.get(id)).filter(Boolean);
}

async function ensureCaregiver(userId) {
  const caregiver = await caregiversCollection().findOne({ _id: toObjectId(userId) });
  if (!caregiver) {
    throw forbidden('Nur Kindertagespflegepersonen dürfen diese Aktion ausführen.');
  }
  return serializeCaregiver(caregiver);
}

export async function listGroupsForUser(userId) {
  await ensureGroupIndexes();
  const groups = await groupsCollection().find({ allParticipantIds: userId, leftBy: { $ne: userId } }).sort({ updatedAt: -1 }).toArray();
  return groups.map(serializeGroup);
}

export async function getGroupByIdForUser(groupId, userId) {
  await ensureGroupIndexes();
  const _id = toObjectId(groupId);
  if (!_id) {
    throw badRequest('Ungültige Gruppen-ID.');
  }
  const group = await groupsCollection().findOne({ _id, allParticipantIds: userId });
  if (!group) {
    throw notFound('Gruppe wurde nicht gefunden.');
  }
  return serializeGroup(group);
}

export async function createGroup({ userId, participantIds }) {
  await ensureCaregiver(userId);
  const normalizedParticipants = Array.from(new Set((Array.isArray(participantIds) ? participantIds : []).filter(Boolean)));
  const parentDocs = await enrichParents(normalizedParticipants);
  const validParentIds = parentDocs.map((entry) => entry.id);

  const caregiver = await caregiversCollection().findOne({ _id: toObjectId(userId) });
  const document = {
    caregiverId: userId,
    adminIds: [userId],
    participantIds: validParentIds,
    allParticipantIds: [userId, ...validParentIds],
    name: caregiver?.daycareName || caregiver?.name || 'Betreuungsgruppe',
    daycareName: caregiver?.daycareName || null,
    logoImageUrl: caregiver?.logoImageUrl || null,
    profileImageUrl: caregiver?.profileImageUrl || null,
    description: caregiver?.shortDescription || caregiver?.bio || null,
    careTimes: Array.isArray(caregiver?.careTimes) ? caregiver.careTimes : [],
    mutedBy: [],
    leftBy: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await groupsCollection().insertOne(document);
  return serializeGroup({ _id: result.insertedId, ...document });
}

export async function listGroupMessages({ groupId, userId }) {
  const group = await getGroupByIdForUser(groupId, userId);
  const messages = await groupMessagesCollection().find({ groupId, participantIds: userId }).sort({ createdAt: 1 }).toArray();
  return { group, messages: messages.map(serializeGroupMessage) };
}

export async function sendGroupMessage({ groupId, userId, body, attachments = [] }) {
  const group = await getGroupByIdForUser(groupId, userId);
  if (group.caregiverId !== userId || !group.adminIds?.includes(userId)) {
    throw forbidden('Aktuell darf nur die Kindertagespflegeperson schreiben.');
  }

  const textBody = typeof body === 'string' ? body.trim() : '';
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
  if (!textBody && !hasAttachments) {
    throw badRequest('Nachricht ist leer.');
  }

  const uploaded = [];
  for (const attachment of attachments) {
    if (!attachment?.data) {
      continue; // eslint-disable-line no-continue
    }
    const stored = await storeBase64File({
      base64: attachment.data,
      originalName: attachment.name || attachment.fileName,
      folder: `groups/${groupId}`,
      fallbackExtension: attachment.mimeType?.split('/')?.pop() || '',
    });
    uploaded.push({ ...stored, mimeType: stored.mimeType || attachment.mimeType || null });
  }

  const document = {
    groupId,
    senderId: userId,
    participantIds: group.allParticipantIds,
    body: textBody,
    attachments: uploaded,
    readBy: [userId],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await groupMessagesCollection().insertOne(document);
  await groupsCollection().updateOne({ _id: toObjectId(groupId) }, { $set: { updatedAt: new Date() } });
  return serializeGroupMessage({ _id: result.insertedId, ...document });
}

export async function markGroupRead({ groupId, userId }) {
  await getGroupByIdForUser(groupId, userId);
  await groupMessagesCollection().updateMany({ groupId, participantIds: userId, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } });
  return true;
}

export async function setMuteStatus({ groupId, userId, muted }) {
  await getGroupByIdForUser(groupId, userId);
  await groupsCollection().updateOne(
    { _id: toObjectId(groupId) },
    muted ? { $addToSet: { mutedBy: userId }, $set: { updatedAt: new Date() } } : { $pull: { mutedBy: userId }, $set: { updatedAt: new Date() } },
  );
  return getGroupByIdForUser(groupId, userId);
}

export async function leaveGroup({ groupId, userId }) {
  await getGroupByIdForUser(groupId, userId);
  await groupsCollection().updateOne({ _id: toObjectId(groupId) }, { $addToSet: { leftBy: userId }, $set: { updatedAt: new Date() } });
  return true;
}

export async function updateParticipants({ groupId, userId, addParentIds = [], removeParentIds = [] }) {
  const group = await getGroupByIdForUser(groupId, userId);
  if (group.caregiverId !== userId) {
    throw forbidden();
  }

  const current = new Set(group.participantIds || []);
  const validAdds = (await enrichParents(Array.from(new Set(addParentIds.filter(Boolean))))).map((entry) => entry.id);
  for (const id of validAdds) {
    current.add(id);
  }
  for (const id of removeParentIds.filter(Boolean)) {
    current.delete(id);
  }

  const participantIds = Array.from(current);
  await groupsCollection().updateOne(
    { _id: toObjectId(groupId) },
    {
      $set: {
        participantIds,
        allParticipantIds: [group.caregiverId, ...participantIds],
        updatedAt: new Date(),
      },
    },
  );
  return getGroupByIdForUser(groupId, userId);
}

export async function listParticipantSuggestions(userId) {
  await ensureCaregiver(userId);

  const contacts = await caregiverContactsCollection().find({ caregiverId: userId }).toArray();
  const fromMessages = await messagesCollection()
    .aggregate([
      { $match: { participants: userId } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          createdAt: 1,
          parentId: {
            $cond: [{ $eq: ['$senderId', userId] }, '$recipientId', '$senderId'],
          },
        },
      },
      { $group: { _id: '$parentId', lastMessageAt: { $max: '$createdAt' } } },
      { $sort: { lastMessageAt: -1 } },
    ])
    .toArray();

  const merged = new Map();
  for (const entry of contacts) {
    merged.set(entry.parentId, { parentId: entry.parentId, lastMessageAt: entry.updatedAt || entry.createdAt || null, isContact: true });
  }
  for (const entry of fromMessages) {
    if (!entry?._id) {
      continue; // eslint-disable-line no-continue
    }
    const current = merged.get(entry._id);
    merged.set(entry._id, {
      parentId: entry._id,
      lastMessageAt: current?.lastMessageAt && current.lastMessageAt > entry.lastMessageAt ? current.lastMessageAt : entry.lastMessageAt,
      isContact: current?.isContact || false,
    });
  }

  const candidateIds = Array.from(merged.keys());
  const parents = await enrichParents(candidateIds);
  const parentMap = new Map(parents.map((parent) => [parent.id, parent]));

  return Array.from(merged.values())
    .map((entry) => ({ ...entry, parent: parentMap.get(entry.parentId) }))
    .filter((entry) => entry.parent)
    .sort((a, b) => new Date(b.lastMessageAt || 0).valueOf() - new Date(a.lastMessageAt || 0).valueOf());
}

export async function listContacts(userId) {
  await ensureCaregiver(userId);
  const contacts = await caregiverContactsCollection().find({ caregiverId: userId }).sort({ updatedAt: -1 }).toArray();
  const parents = await enrichParents(contacts.map((entry) => entry.parentId));
  const parentMap = new Map(parents.map((parent) => [parent.id, parent]));
  return contacts.map((entry) => ({ ...entry, parent: parentMap.get(entry.parentId) })).filter((entry) => entry.parent);
}

export async function addContact({ userId, parentId }) {
  await ensureCaregiver(userId);
  const parent = await parentsCollection().findOne({ _id: toObjectId(parentId) });
  if (!parent) {
    throw notFound('Elternaccount nicht gefunden.');
  }

  await caregiverContactsCollection().updateOne(
    { caregiverId: userId, parentId },
    { $set: { caregiverId: userId, parentId, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true },
  );
  return true;
}

export async function removeContact({ userId, parentId }) {
  await ensureCaregiver(userId);
  await caregiverContactsCollection().deleteOne({ caregiverId: userId, parentId });
  return true;
}
