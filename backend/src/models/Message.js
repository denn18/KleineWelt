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

function normalizeAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments
    .filter((attachment) => attachment && (attachment.url || attachment.key))
    .map((attachment) => ({
      key: attachment.key ?? null,
      url: attachment.url ?? null,
      fileName: attachment.fileName || attachment.name || 'Anhang',
      mimeType: attachment.mimeType || null,
      size: typeof attachment.size === 'number' ? attachment.size : null,
      uploadedAt: attachment.uploadedAt || null,
    }));
}

export function buildMessageDocument({ conversationId, senderId, recipientId, body, attachments = [] }) {
  const now = new Date();

  return {
    conversationId,
    participants: Array.from(new Set([senderId, recipientId])),
    senderId,
    recipientId,
    body,
    attachments: normalizeAttachments(attachments),
    readBy: [senderId],
    createdAt: now,
    updatedAt: now,
  };
}
