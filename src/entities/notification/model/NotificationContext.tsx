import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { notificationApi } from '../api/notificationApi';
import type { Notification } from './types';

interface NotificationContextValue {
  notifications:  Notification[];
  unreadCount:    number;
  markRead:       (id: string) => Promise<void>;
  markAllRead:    () => Promise<void>;
  addNotification:(n: Notification) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

function buildSocketUrl(): string {
  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
  // Strip trailing /api segment to get the server root for Socket.IO.
  // Fall back to the current origin (NOT '/', which socket.io parses as a
  // protocol-relative URL and turns the namespace into the host → ws://chat).
  return apiUrl.replace(/\/api\/?$/, '') || window.location.origin;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter(n => !n.readAt).length;

  // Initial load
  useEffect(() => {
    notificationApi.list({ page: 1, limit: 50 }).then(list => {
      setNotifications(list);
    }).catch(() => { /* non-critical */ });
  }, []);

  // WebSocket connection
  useEffect(() => {
    const url = buildSocketUrl();
    const socket: Socket = io(`${url}/notifications`, {
      withCredentials: true,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('notification:created', (raw: unknown) => {
      const n = raw as Notification;
      setNotifications(prev => [n, ...prev]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const markRead = useCallback(async (id: string) => {
    await notificationApi.markRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead();
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? now })));
  }, []);

  const addNotification = useCallback((n: Notification) => {
    setNotifications(prev => [n, ...prev]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
