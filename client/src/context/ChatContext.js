import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server');
    });

    newSocket.on('receiveMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('userJoined', (user) => {
      setOnlineUsers(prev => [...prev, user]);
    });

    newSocket.on('userLeft', (userId) => {
      setOnlineUsers(prev => prev.filter(user => user.id !== userId));
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const sendMessage = (message) => {
    if (socket && message.trim()) {
      const messageData = {
        text: message,
        timestamp: new Date().toISOString(),
        id: Date.now()
      };
      
      socket.emit('sendMessage', messageData);
      setMessages(prev => [...prev, messageData]);
    }
  };

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
  };

  const value = {
    socket,
    messages,
    isConnected,
    onlineUsers,
    sendMessage,
    joinRoom,
    leaveRoom
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}; 