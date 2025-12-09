import { buildMessageDocument, messagesCollection, serializeMessage } from '../models/Message.js';
import { storeBase64File } from '../utils/fileStorage.js';
import { notifyRecipientOfMessage } from './notificationService.js';

let messagesCollectionOverride = null;

function getMessagesCollection() {
  return messagesCollectionOverride ?? messagesCollection();
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

export async function listMessages(conversationId) {
  const cursor = getMessagesCollection()
    .find({ conversationId })
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

  const storedAttachments = await storeAttachments(conversationId, attachments);
  const document = buildMessageDocument({
    conversationId,
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
    conversationId,
  }).catch((error) => {
    console.error('Konnte Empfänger nicht benachrichtigen:', error);
  });

  return serialized;
}

export async function listConversationsForUser(participantId) {
  const cursor = getMessagesCollection()
    .aggregate([
      { $match: { participants: participantId } },
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
