import { io } from 'socket.io-client';

let socket = null;

export function getOrCreateSocket(token) {
  if (!token) {
    return null;
  }

  if (!socket) {
    socket = io('/', {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
    });
  }

  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}
