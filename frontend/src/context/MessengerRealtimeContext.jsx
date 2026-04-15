import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const MessengerRealtimeContext = createContext({
  isConnected: false,
  joinConversation: () => {},
  setActiveConversation: () => {},
  subscribeNewMessage: () => () => {},
  subscribeConversationUpdated: () => () => {},
  subscribeReconnect: () => () => {},
});

export function MessengerRealtimeProvider({ children }) {
  const { user, isAuthReady, getValidAccessToken } = useAuth();
  const socketRef = useRef(null);
  const activeConversationIdRef = useRef('');
  const listenersRef = useRef({
    newMessage: new Set(),
    conversationUpdated: new Set(),
    reconnect: new Set(),
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    const token = getValidAccessToken();
    if (!user?.id || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const socket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: false,
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);

      const activeConversationId = activeConversationIdRef.current;
      if (activeConversationId) {
        socket.emit('join-conversation', { conversationId: activeConversationId });
      }

      listenersRef.current.reconnect.forEach((callback) => callback());
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewMessage = (message) => {
      listenersRef.current.newMessage.forEach((callback) => callback(message));
    };

    const handleConversationUpdated = (payload) => {
      listenersRef.current.conversationUpdated.forEach((callback) => callback(payload));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('messenger:new-message', handleNewMessage);
    socket.on('messenger:conversation-updated', handleConversationUpdated);
    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('messenger:new-message', handleNewMessage);
      socket.off('messenger:conversation-updated', handleConversationUpdated);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [getValidAccessToken, isAuthReady, user?.id]);

  function joinConversation(conversationId) {
    if (!conversationId) {
      return;
    }

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('join-conversation', { conversationId });
  }

  function setActiveConversation(conversationId) {
    activeConversationIdRef.current = conversationId || '';
    joinConversation(activeConversationIdRef.current);
  }

  function subscribeNewMessage(callback) {
    listenersRef.current.newMessage.add(callback);
    return () => listenersRef.current.newMessage.delete(callback);
  }

  function subscribeConversationUpdated(callback) {
    listenersRef.current.conversationUpdated.add(callback);
    return () => listenersRef.current.conversationUpdated.delete(callback);
  }

  function subscribeReconnect(callback) {
    listenersRef.current.reconnect.add(callback);
    return () => listenersRef.current.reconnect.delete(callback);
  }

  const value = useMemo(
    () => ({
      isConnected,
      joinConversation,
      setActiveConversation,
      subscribeNewMessage,
      subscribeConversationUpdated,
      subscribeReconnect,
    }),
    [isConnected],
  );

  return <MessengerRealtimeContext.Provider value={value}>{children}</MessengerRealtimeContext.Provider>;
}

export function useMessengerRealtime() {
  return useContext(MessengerRealtimeContext);
}
