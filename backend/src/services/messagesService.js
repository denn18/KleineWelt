import Message from '../models/Message.js';

export async function listMessages(conversationId) {
  return Message.find({ conversationId }).sort({ createdAt: 1 });
}

export async function sendMessage({ conversationId, senderId, body }) {
  const message = await Message.create({
    conversationId,
    senderId,
    body,
  });

  return message;
}
