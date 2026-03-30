'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

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

interface SessionContextType {
  session: ActiveSession | null;
  table: SessionTable | null;
  restaurant: SessionRestaurant | null;
  deviceId: string;
  isLoading: boolean;
  /** Call when user scans a QR code token. Handles create or join. */
  scanAndJoin: (qrToken: string) => Promise<ActiveSession>;
  /** Manually refresh participant list */
  refreshSession: () => Promise<void>;
  /** Leave the current session and clear state */
  leaveSession: () => Promise<void>;
  /** Clear session state without API call (e.g. after session ends) */
  clearSession: () => void;
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

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [table, setTable] = useState<SessionTable | null>(null);
  const [restaurant, setRestaurant] = useState<SessionRestaurant | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Live participant polling — refresh every 5 seconds while a session is active
  useEffect(() => {
    if (!session?.id) return;
    const interval = setInterval(async () => {
      try {
        const participants = await api.getSessionParticipants(session.id);
        setSession((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, participants };
          // Update persisted copy silently (table/restaurant stay the same)
          persistSession(updated, table, restaurant);
          return updated;
        });
      } catch {
        // Network blip — ignore, will retry next tick
      }
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const scanAndJoin = useCallback(async (qrToken: string): Promise<ActiveSession> => {
    setIsLoading(true);
    try {
      const id = getOrCreateDeviceId();
      const data = await api.scanAndJoin(qrToken, id);
      const newSession: ActiveSession = data.session;
      const newTable: SessionTable = data.table;
      const newRestaurant: SessionRestaurant = data.restaurant;

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
    if (!session) return;
    try {
      const updated = await api.getSession(session.id);
      setSession(updated);
      persistSession(updated, table, restaurant);
    } catch {
      // Silently fail on refresh
    }
  }, [session, table, restaurant]);

  const leaveSession = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const id = getOrCreateDeviceId();
      await api.leaveSession(session.id, id);
    } finally {
      setSession(null);
      setTable(null);
      setRestaurant(null);
      persistSession(null, null, null);
      setIsLoading(false);
    }
  }, [session]);

  const clearSession = useCallback(() => {
    setSession(null);
    setTable(null);
    setRestaurant(null);
    persistSession(null, null, null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        table,
        restaurant,
        deviceId,
        isLoading,
        scanAndJoin,
        refreshSession,
        leaveSession,
        clearSession,
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
