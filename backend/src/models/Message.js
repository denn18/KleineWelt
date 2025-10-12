import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';

const COLLECTION_NAME = 'messages';

export function messagesCollection() {
  return getDatabase().collection(COLLECTION_NAME);
}

export function serializeMessage(document) {
  if (!document) {
    return null;
  }

  const { _id, ...rest } = document;
  return {
    id: _id.toString(),
    ...rest,
  };
}

export function toObjectId(id) {
  if (!id) {
    return null;
  }

  try {
    return new ObjectId(id);
  } catch (_error) {
    return null;
  }
}

export function buildMessageDocument({ conversationId, senderId, recipientId, body }) {
  const now = new Date();

  return {
    conversationId,
    participants: Array.from(new Set([senderId, recipientId])),
    senderId,
    recipientId,
    body,
    createdAt: now,
    updatedAt: now,
  };
}
