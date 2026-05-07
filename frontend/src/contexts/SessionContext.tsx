'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
// ─── Types ─────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: number;
  name: string;
  email?: string;
}

export interface SessionParticipant {
  id: number;
  session_id: number;
  user_id: number | null;
  device_id: string | null;
  is_host: boolean;
  joined_at: string;
  left_at: string | null;
  user: SessionUser | null;
}

export interface SessionTable {
  id: number;
  table_number: string;
  capacity: number;
  status: string;
  restaurant_id: number;
}

export interface SessionRestaurant {
  id: number;
  name: string;
  slug: string;
}

export interface ActiveSession {
  id: number;
  table_id: number;
  restaurant_id: number;
  session_token: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  table: SessionTable;
  participants: SessionParticipant[];
}

export interface ActiveOrder {
  orderId: number;
  orderNumber: string;
  status: string;
}

export interface ServiceRequest {
  id: number;
  requestType: string;
  status: 'pending' | 'acknowledged' | 'resolved' | 'cancelled';
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
}

interface SessionContextType {
  session: ActiveSession | null;
  table: SessionTable | null;
  restaurant: SessionRestaurant | null;
  deviceId: string;
  isLoading: boolean;
  activeOrders: ActiveOrder[];
  activeServiceRequests: ServiceRequest[];
  /** Call when user scans a QR code token. Handles create or join. */
  scanAndJoin: (qrToken: string) => Promise<ActiveSession>;
  /** Manually refresh participant list */
  refreshSession: () => Promise<void>;
  /** Leave the current session and clear state */
  leaveSession: () => Promise<void>;
  /** Clear session state without API call (e.g. after session ends) */
  clearSession: () => void;
  /** Submit a waiter assistance request for the current session */
  submitWaiterRequest: (type: string, message?: string, priority?: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const STORAGE_KEY = 'active_session';

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Generate or retrieve a stable browser device ID */
function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr-device';
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
    localStorage.setItem('device_id', id);
  }
  return id;
}

function persistSession(session: ActiveSession | null, table: SessionTable | null, restaurant: SessionRestaurant | null) {
  if (typeof window === 'undefined') return;
  if (session) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ session, table, restaurant }));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

function loadPersistedSession(): { session: ActiveSession; table: SessionTable; restaurant: SessionRestaurant } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [table, setTable] = useState<SessionTable | null>(null);
  const [restaurant, setRestaurant] = useState<SessionRestaurant | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [activeServiceRequests, setActiveServiceRequests] = useState<ServiceRequest[]>([]);
  const leavingRef = useRef(false);

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
    const persisted = loadPersistedSession();
    if (persisted) {
      setSession(persisted.session);
      setTable(persisted.table);
      setRestaurant(persisted.restaurant);
    }
  }, []);

  const scanAndJoin = useCallback(async (qrToken: string): Promise<ActiveSession> => {
    setIsLoading(true);
    try {
      const id = getOrCreateDeviceId();
      const data = await api.scanAndJoin(qrToken, id);
      const newSession: ActiveSession = data.session;
      const newTable: SessionTable = data.table;
      const newRestaurant: SessionRestaurant = data.restaurant;

      leavingRef.current = false;
      setSession(newSession);
      setTable(newTable);
      setRestaurant(newRestaurant);
      persistSession(newSession, newTable, newRestaurant);

      return newSession;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!session || leavingRef.current) return;
    try {
      const updated = await api.getSession(session.id);
      // Guard again after await — leaveSession may have been called while waiting
      if (leavingRef.current) return;
      setSession(updated);
      persistSession(updated, table, restaurant);
    } catch {
      // Silently fail on refresh
    }
  }, [session, table, restaurant]);

  const leaveSession = useCallback(async () => {
    if (!session) return;
    leavingRef.current = true;
    setIsLoading(true);
    try {
      const id = getOrCreateDeviceId();
      await api.leaveSession(session.id, id);
    } finally {
      // Leave socket rooms so no further events reach this client
      socketClient.leaveSession(session.id);
      if (restaurant && table) {
        socketClient.leaveTable(restaurant.id, table.id);
      }
      setSession(null);
      setTable(null);
      setRestaurant(null);
      persistSession(null, null, null);
      setIsLoading(false);
    }
  }, [session, restaurant, table]);

  const clearSession = useCallback(() => {
    if (session) {
      socketClient.leaveSession(session.id);
    }
    if (restaurant && table) {
      socketClient.leaveTable(restaurant.id, table.id);
    }
    setSession(null);
    setTable(null);
    setRestaurant(null);
    persistSession(null, null, null);
  }, [session, restaurant, table]);

  const refreshSessionRef = useRef(refreshSession);
  useEffect(() => {
    refreshSessionRef.current = refreshSession;
  }, [refreshSession]);

  // Listen for real-time events via Socket.io
  useEffect(() => {
    if (!session?.id) return;

    socketClient.connect();

    // Join session room for participant updates
    socketClient.joinSession(session.id);

    // Join table room for order status updates
    if (restaurant && table) {
      socketClient.joinTable(restaurant.id, table.id);
    }

    // Fetch initial active orders for this session
    (async () => {
      try {
        const orders = await api.getSessionOrders(session.id);
        if (Array.isArray(orders)) {
          const sessionOrders: ActiveOrder[] = orders
            .filter((o: any) => ACTIVE_STATUSES.includes(o.status))
            .map((o: any) => ({ orderId: o.id, orderNumber: o.order_number, status: o.status }));
          setActiveOrders(sessionOrders);
        }
      } catch {
        // Silently fail — orders will populate via socket events
      }
    })();

    // Session participant changes
    const handleSessionChange = () => { refreshSessionRef.current(); };
    socketClient.onSessionStateChanged(handleSessionChange);

    // New order placed at this table
    const handleOrderConfirmed = (data: any) => {
      setActiveOrders((prev) => {
        if (prev.some((o) => o.orderId === data.orderId)) return prev;
        return [...prev, { orderId: data.orderId, orderNumber: data.orderNumber, status: 'confirmed' }];
      });
    };
    socketClient.onOrderConfirmed(handleOrderConfirmed);

    // Order status changed from KDS
    const handleStatusChanged = (data: any) => {
      const { orderId, status } = data;
      if (ACTIVE_STATUSES.includes(status)) {
        setActiveOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, status } : o)));
      } else {
        setActiveOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      }
    };
    socketClient.onStatusChanged(handleStatusChanged);

    // Waiter request confirmed (sent from server after POST /service-requests)
    const handleWaiterConfirmed = (data: any) => {
      setActiveServiceRequests((prev) => {
        if (prev.some((r) => r.id === data.requestId)) return prev;
        return [...prev, { id: data.requestId, requestType: data.requestType, status: 'pending' }];
      });
    };
    socketClient.onWaiterRequestConfirmed(handleWaiterConfirmed);

    // Waiter request status updated (acknowledged / resolved)
    const handleWaiterUpdated = (data: any) => {
      const { requestId, status, acknowledgedAt, resolvedAt } = data;
      setActiveServiceRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status, acknowledgedAt, resolvedAt } : r
        )
      );
    };
    socketClient.onWaiterRequestUpdated(handleWaiterUpdated);

    return () => {
      socketClient.offSessionStateChanged(handleSessionChange);
      socketClient.offOrderConfirmed(handleOrderConfirmed);
      socketClient.offStatusChanged(handleStatusChanged);
      socketClient.offWaiterRequestConfirmed(handleWaiterConfirmed);
      socketClient.offWaiterRequestUpdated(handleWaiterUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, restaurant?.id, table?.id]);

  const submitWaiterRequest = useCallback(async (
    type: string,
    message?: string,
    priority: string = 'medium'
  ) => {
    if (!session || !table || !restaurant) throw new Error('No active session');
    const { api } = await import('@/lib/api');
    await api.createServiceRequest({
      restaurant_id: restaurant.id,
      table_id:      table.id,
      session_id:    session.id,
      request_type:  type,
      priority,
      message,
    });
    // The socket server will emit 'waiter:request:confirmed' back to this session room
  }, [session, table, restaurant]);

  return (
    <SessionContext.Provider
      value={{
        session,
        table,
        restaurant,
        deviceId,
        isLoading,
        activeOrders,
        activeServiceRequests,
        scanAndJoin,
        refreshSession,
        leaveSession,
        clearSession,
        submitWaiterRequest,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

// ─── Hook ──────────────────────────────────────────────────────────────────

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
