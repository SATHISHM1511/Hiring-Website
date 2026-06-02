import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';
import { toast } from 'react-toastify';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token, updateProfile } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('authenticate', user.id);
      });

      newSocket.on('authenticated', ({ success }) => {
        if (success) console.log('Socket authenticated');
      });

      newSocket.on('notification', (notif) => {
        setNotifications(prev => [{ ...notif, id: Date.now(), created_at: new Date(), is_read: false }, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.info(`🔔 ${notif.title}: ${notif.message}`, { autoClose: 5000 });
      });

      newSocket.on('profile_updated', (updatedData) => {
        updateProfile(updatedData);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user, token]);

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev]);
    if (!notif.is_read) setUnreadCount(prev => prev + 1);
  };

  const setInitialNotifications = (notifs, count) => {
    setNotifications(notifs);
    setUnreadCount(count);
  };

  return (
    <SocketContext.Provider value={{
      socket, notifications, unreadCount,
      markRead, markAllRead, addNotification, setInitialNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
