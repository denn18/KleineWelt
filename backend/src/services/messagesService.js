import {
  buildMessageDocument,
  messagesCollection,
  serializeMessage,
} from '../models/Message.js';

export async function listMessages(conversationId) {
  const cursor = messagesCollection()
    .find({ conversationId })
    .sort({ createdAt: 1 });
  const documents = await cursor.toArray();

  return documents.map(serializeMessage);
}

export async function sendMessage({ conversationId, senderId, body }) {
  if (!conversationId || !senderId || !body) {
    const error = new Error('Missing required message fields.');
    error.status = 400;
    throw error;
  }

  const document = buildMessageDocument({ conversationId, senderId, body });
  const result = await messagesCollection().insertOne(document);

  return serializeMessage({ _id: result.insertedId, ...document });
}
