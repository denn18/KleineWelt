import { buildMessageDocument, messagesCollection, serializeMessage } from '../models/Message.js';
import { notifyRecipientOfMessage } from './notificationService.js';

let messagesCollectionOverride = null;

function getMessagesCollection() {
  return messagesCollectionOverride ?? messagesCollection();
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

export async function sendMessage({ conversationId, senderId, recipientId, body }) {
  if (!conversationId || !senderId || !recipientId || !body) {
    const error = new Error('Missing required message fields.');
    error.status = 400;
    throw error;
  }

  const document = buildMessageDocument({ conversationId, senderId, recipientId, body });
  const result = await getMessagesCollection().insertOne(document);

  const serialized = serializeMessage({ _id: result.insertedId, ...document });

  notifyRecipientOfMessage({
    recipientId,
    senderId,
    messageBody: body,
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
