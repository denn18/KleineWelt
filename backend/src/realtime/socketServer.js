import { verifyAuthToken } from '../utils/authToken.js';

let ioInstance = null;

export function setSocketServer(io) {
  ioInstance = io;
}

export function getSocketServer() {
  return ioInstance;
}

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const authToken = socket.handshake.auth?.token;
    const bearer = socket.handshake.headers?.authorization;
    const headerToken = typeof bearer === 'string' && bearer.startsWith('Bearer ') ? bearer.slice(7).trim() : '';
    const token = authToken || headerToken;

    const payload = verifyAuthToken(token);
    if (!payload) {
      return next(new Error('Unauthorized'));
    }

    socket.user = {
      id: payload.id,
      role: payload.role,
      email: payload.email,
    };

    return next();
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('messenger:join-conversation', ({ conversationId } = {}) => {
      if (!conversationId || typeof conversationId !== 'string') {
        return;
      }

      if (conversationId.includes(userId) || conversationId.startsWith('caregroup--')) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on('messenger:leave-conversation', ({ conversationId } = {}) => {
      if (!conversationId || typeof conversationId !== 'string') {
        return;
      }
      socket.leave(`conversation:${conversationId}`);
    });
  });
}
