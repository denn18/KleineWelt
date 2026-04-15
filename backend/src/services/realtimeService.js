import { Server } from 'socket.io';
import { verifyAuthToken } from '../utils/authToken.js';
import { messagesCollection } from '../models/Message.js';

let ioInstance = null;

function getBearerToken(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  if (value.startsWith('Bearer ')) {
    return value.slice('Bearer '.length).trim();
  }

  return value.trim();
}

async function canJoinConversation({ conversationId, userId }) {
  if (!conversationId || !userId) {
    return false;
  }

  if (conversationId.includes(userId)) {
    return true;
  }

  const existing = await messagesCollection().findOne({ conversationId, participants: userId }, { projection: { _id: 1 } });
  return Boolean(existing);
}

export function initializeRealtime(server) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const tokenFromAuth = getBearerToken(socket.handshake.auth?.token);
    const tokenFromHeader = getBearerToken(socket.handshake.headers?.authorization);
    const token = tokenFromAuth || tokenFromHeader;

    const payload = verifyAuthToken(token);
    if (!payload) {
      return next(new Error('Unauthorized'));
    }

    socket.data.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };

    return next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user?.id;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`user:${userId}`);

    socket.on('join-conversation', async ({ conversationId } = {}, acknowledgement) => {
      try {
        const allowed = await canJoinConversation({ conversationId, userId });
        if (!allowed) {
          if (typeof acknowledgement === 'function') {
            acknowledgement({ ok: false, message: 'Conversation not accessible.' });
          }
          return;
        }

        socket.join(`conversation:${conversationId}`);
        if (typeof acknowledgement === 'function') {
          acknowledgement({ ok: true, conversationId });
        }
      } catch (error) {
        console.error('Failed to join conversation room', error);
        if (typeof acknowledgement === 'function') {
          acknowledgement({ ok: false, message: 'Failed to join conversation.' });
        }
      }
    });
  });

  ioInstance = io;
  return io;
}

export function emitMessageCreated(message) {
  if (!ioInstance || !message) {
    return;
  }

  ioInstance.to(`conversation:${message.conversationId}`).emit('messenger:new-message', message);

  (message.participants || []).forEach((participantId) => {
    ioInstance.to(`user:${participantId}`).emit('messenger:new-message', message);
  });
}

export function emitConversationUpdated({ conversationId, participants }) {
  if (!ioInstance || !conversationId) {
    return;
  }

  const payload = { conversationId, participants: participants || [] };

  ioInstance.to(`conversation:${conversationId}`).emit('messenger:conversation-updated', payload);

  (participants || []).forEach((participantId) => {
    ioInstance.to(`user:${participantId}`).emit('messenger:conversation-updated', payload);
  });
}
