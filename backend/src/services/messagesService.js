import crypto from 'node:crypto';

const conversations = new Map();

export function listMessages(conversationId) {
  return conversations.get(conversationId) ?? [];
}

export function sendMessage({ conversationId, senderId, body }) {
  const message = {
    id: crypto.randomUUID(),
    conversationId,
    senderId,
    body,
    createdAt: new Date().toISOString(),
  };

  const messages = conversations.get(conversationId) ?? [];
  messages.push(message);
  conversations.set(conversationId, messages);
  return message;
}
