import {
  buildGroupMessageDocument,
  buildMessageDocument,
  messagesCollection,
  serializeMessage,
} from '../models/Message.js';
import { storeBase64File } from '../utils/fileStorage.js';
import { careGroupsCollection } from '../models/CareGroup.js';
import { notifyRecipientOfMessage } from './notificationService.js';

let messagesCollectionOverride = null;

function getMessagesCollection() {
  return messagesCollectionOverride ?? messagesCollection();
}

function createForbiddenError(message = 'Du hast keine Berechtigung für diese Unterhaltung.') {
  const error = new Error(message);
  error.status = 403;
  return error;
}

function buildCanonicalConversationId(userA, userB) {
  return [userA, userB].sort().join('--');
}


function buildGroupConversationId(caregiverId) {
  return `caregroup--${caregiverId}`;
}

async function assertGroupConversationAccess({ conversationId, userId }) {
  const ownConversationMessage = await getMessagesCollection().findOne({
    conversationId,
    participants: userId,
    isGroupMessage: true,
  });

  if (ownConversationMessage) {
    return;
  }

  const existingConversation = await getMessagesCollection().findOne({ conversationId, isGroupMessage: true });
  if (existingConversation) {
    throw createForbiddenError();
  }
}

async function assertConversationAccess({ conversationId, userId }) {
  const ownConversationMessage = await getMessagesCollection().findOne({ conversationId, participants: userId });
  if (ownConversationMessage) {
    return;
  }

  const existingConversation = await getMessagesCollection().findOne({ conversationId });
  if (existingConversation) {
    throw createForbiddenError();
  }
}

async function storeAttachments(conversationId, attachments = []) {
  if (!conversationId || !Array.isArray(attachments) || attachments.length === 0) {
    return [];
  }

  const uploaded = [];
  for (const attachment of attachments) {
    if (!attachment?.data) {
      continue; // eslint-disable-line no-continue
    }

    const stored = await storeBase64File({
      base64: attachment.data,
      originalName: attachment.name || attachment.fileName,
      folder: `messages/attachments/${conversationId}`,
      fallbackExtension: attachment.mimeType?.split('/')?.pop() || '',
    });

    uploaded.push({
      ...stored,
      mimeType: stored.mimeType || attachment.mimeType || null,
    });
  }

  return uploaded;
}

export function __setMessagesCollectionForTesting(collection) {
  messagesCollectionOverride = collection ?? null;
}

export function __resetMessagesCollectionForTesting() {
  messagesCollectionOverride = null;
}

export async function listMessages({ conversationId, userId }) {
  if (!conversationId || !userId) {
    const error = new Error('Missing required message fields.');
    error.status = 400;
    throw error;
  }

  await assertConversationAccess({ conversationId, userId });

  const cursor = getMessagesCollection()
    .find({ conversationId, participants: userId })
    .sort({ createdAt: 1 });
  const documents = await cursor.toArray();

  return documents.map(serializeMessage);
}

export async function sendMessage({ conversationId, senderId, recipientId, body, attachments = [] }) {
  const textBody = typeof body === 'string' ? body.trim() : '';
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (!conversationId || !senderId || !recipientId || (!textBody && !hasAttachments)) {
    const error = new Error('Missing required message fields.');
    error.status = 400;
    throw error;
  }

  const expectedConversationId = buildCanonicalConversationId(senderId, recipientId);
  const normalizedConversationId = conversationId === expectedConversationId ? conversationId : expectedConversationId;

  await assertConversationAccess({ conversationId: normalizedConversationId, userId: senderId });

  const storedAttachments = await storeAttachments(normalizedConversationId, attachments);
  const document = buildMessageDocument({
    conversationId: normalizedConversationId,
    senderId,
    recipientId,
    body: textBody,
    attachments: storedAttachments,
  });
  const result = await getMessagesCollection().insertOne(document);

  const serialized = serializeMessage({ _id: result.insertedId, ...document });

  notifyRecipientOfMessage({
    recipientId,
    senderId,
    messageBody: textBody || (storedAttachments.length ? 'Es wurden neue Anhänge gesendet.' : ''),
    conversationId: normalizedConversationId,
  }).catch((error) => {
    console.error('Konnte Empfänger nicht benachrichtigen:', error);
  });

  return serialized;
}

export async function listConversationsForUser(userId) {
  if (!userId) {
    const error = new Error('Missing required participant field.');
    error.status = 400;
    throw error;
  }

  const cursor = getMessagesCollection()
    .aggregate([
      { $match: { participants: userId, isGroupMessage: { $ne: true } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$lastMessage' } },
      { $sort: { createdAt: -1 } },
    ]);

  const documents = await cursor.toArray();
  return documents.map(serializeMessage);
}

export async function markConversationAsRead({ conversationId, userId }) {
  if (!conversationId || !userId) {
    const error = new Error('Missing required read fields.');
    error.status = 400;
    throw error;
  }

  await assertConversationAccess({ conversationId, userId });

  await getMessagesCollection().updateMany(
    { conversationId, participants: userId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId }, $set: { updatedAt: new Date() } },
  );

  return listMessages({ conversationId, userId });
}

export async function deleteConversation({ conversationId, userId }) {
  if (!conversationId || !userId) {
    const error = new Error('Missing required delete fields.');
    error.status = 400;
    throw error;
  }

  await assertConversationAccess({ conversationId, userId });

  await getMessagesCollection().deleteMany({ conversationId, participants: userId });
  return true;
}


export async function listGroupMessages({ conversationId, userId }) {
  if (!conversationId || !userId) {
    const error = new Error('Missing required message fields.');
    error.status = 400;
    throw error;
  }

  await assertGroupConversationAccess({ conversationId, userId });

  const cursor = getMessagesCollection()
    .find({ conversationId, participants: userId, isGroupMessage: true })
    .sort({ createdAt: 1 });
  const documents = await cursor.toArray();

  return documents.map(serializeMessage);
}

export async function sendGroupMessage({ caregiverId, senderId, participantIds = [], body, attachments = [] }) {
  const textBody = typeof body === 'string' ? body.trim() : '';
  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  if (!caregiverId || !senderId || (!textBody && !hasAttachments)) {
    const error = new Error('Missing required message fields.');
    error.status = 400;
    throw error;
  }

  const normalizedConversationId = buildGroupConversationId(caregiverId);
  await assertGroupConversationAccess({ conversationId: normalizedConversationId, userId: senderId });

  const storedAttachments = await storeAttachments(normalizedConversationId, attachments);
  const document = buildGroupMessageDocument({
    conversationId: normalizedConversationId,
    senderId,
    participantIds,
    body: textBody,
    attachments: storedAttachments,
  });

  const result = await getMessagesCollection().insertOne(document);
  const serialized = serializeMessage({ _id: result.insertedId, ...document });

  const recipients = Array.from(new Set((participantIds || []).filter((id) => id && id !== senderId)));

  await Promise.allSettled(
    recipients.map((recipientId) =>
      notifyRecipientOfMessage({
        recipientId,
        senderId,
        messageBody: textBody || (storedAttachments.length ? 'Es wurden neue Anhänge gesendet.' : ''),
        conversationId: normalizedConversationId,
      }),
    ),
  );

  return serialized;
}

export { buildGroupConversationId };
