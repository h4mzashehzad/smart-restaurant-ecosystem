'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { CartItem, CartItemCustomization } from '@/types/cart';
import { buildCartLineKey } from '@/types/cart';
import { useSession } from '@/contexts/SessionContext';
import { socketClient } from '@/lib/socket';

const STORAGE_KEY = 'cart_items';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  specialInstructions: string;
  addItem: (item: Omit<CartItem, 'quantity' | 'lineKey'> & { lineKey?: string }) => void;
  removeItem: (lineKey: string) => void;
  updateQty: (lineKey: string, qty: number) => void;
  clearCart: () => void;
  setInstructions: (s: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function normalizeCartItem(item: CartItem & { lineKey?: string }): CartItem {
  const customizations = item.customizations ?? [];
  return {
    ...item,
    customizations,
    lineKey: item.lineKey || buildCartLineKey(item.id, customizations),
  };
}

function loadPersisted(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return parsed.map(normalizeCartItem);
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Merge remote items into local cart (union by lineKey, take max qty for shared lines) */
function mergeItems(local: CartItem[], remote: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of local) {
    const normalized = normalizeCartItem(item);
    map.set(normalized.lineKey, { ...normalized });
  }
  for (const item of remote) {
    const normalized = normalizeCartItem(item);
    const existing = map.get(normalized.lineKey);
    if (existing) {
      existing.quantity = Math.max(existing.quantity, normalized.quantity);
    } else {
      map.set(normalized.lineKey, { ...normalized });
    }
  }
  return Array.from(map.values());
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const initialSyncDone = useRef(false);

  // Track the last serialized cart we broadcast OR received, to prevent echo loops
  const lastSyncedJson = useRef<string>('');

  useEffect(() => {
    setItems(loadPersisted());
  }, []);

  // Broadcast cart to other devices whenever items change locally
  const mountedRef = useRef(false);
  useEffect(() => {
    // Skip the very first render (initial load from localStorage)
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!session?.id) return;

    const json = JSON.stringify(items);
    // Skip if this is the same cart we just synced (received or sent)
    if (json === lastSyncedJson.current) return;

    lastSyncedJson.current = json;
    console.log('[CartSync] Broadcasting', items.length, 'items to session', session.id);
    socketClient.emitCartUpdate(session.id, items);
  }, [items, session?.id]);

  // Reset sync state when session is cleared (user left)
  useEffect(() => {
    if (!session?.id) {
      initialSyncDone.current = false;
      lastSyncedJson.current = '';
    }
  }, [session?.id]);

  // Listen for remote cart updates
  useEffect(() => {
    if (!session?.id) return;

    // Ensure socket exists before registering listener (connect is idempotent)
    socketClient.connect();

    const handleCartSync = (data: { sessionId: number; items: CartItem[] }) => {
      console.log('[CartSync] Received remote cart sync:', data.items.length, 'items, sessionId:', data.sessionId);
      if (data.sessionId !== session.id) return;

      // Mark this payload as already-synced so the broadcast effect won't echo it
      lastSyncedJson.current = JSON.stringify(data.items);

      if (!initialSyncDone.current) {
        // First sync — merge remote into local
        initialSyncDone.current = true;
        setItems((prev) => {
          const merged = mergeItems(prev, data.items.map(normalizeCartItem));
          persist(merged);
          // Update synced ref to the merged result (what we'll actually render)
          lastSyncedJson.current = JSON.stringify(merged);
          return merged;
        });
      } else {
        // Subsequent syncs — replace with remote
        const normalized = data.items.map(normalizeCartItem);
        persist(normalized);
        setItems(normalized);
      }
    };

    socketClient.onCartSync(handleCartSync);
    return () => {
      socketClient.offCartSync(handleCartSync);
    };
  }, [session?.id]);

  // Broadcast current cart when session starts (so other devices get it)
  useEffect(() => {
    if (!session?.id) return;
    // Wait for socket to connect and join session room, then broadcast
    const handleConnected = () => {
      const current = loadPersisted();
      if (current.length > 0) {
        socketClient.emitCartUpdate(session.id, current);
      }
    };
    // If already connected, broadcast after a short delay for room join
    if (socketClient.isConnected()) {
      const timer = setTimeout(handleConnected, 500);
      return () => clearTimeout(timer);
    }
    // Otherwise wait for connect event
    socketClient.onConnect(handleConnected);
    return () => {
      socketClient.offConnect(handleConnected);
    };
  }, [session?.id]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity' | 'lineKey'> & { lineKey?: string }) => {
    setItems((prev) => {
      const customizations: CartItemCustomization[] = item.customizations ?? [];
      const lineKey = item.lineKey || buildCartLineKey(item.id, customizations);
      const existing = prev.find((i) => i.lineKey === lineKey);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i.lineKey === lineKey ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        next = [
          ...prev,
          {
            ...item,
            customizations,
            lineKey,
            quantity: 1,
          },
        ];
      }
      persist(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.lineKey !== lineKey);
      persist(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((lineKey: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) => {
      const next = prev.map((i) => (i.lineKey === lineKey ? { ...i, quantity: qty } : i));
      persist(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSpecialInstructions('');
    persist([]);
  }, []);

  const setInstructions = useCallback((s: string) => {
    setSpecialInstructions(s);
  }, []);

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.12 * 100) / 100;
  const total = subtotal + taxAmount;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        taxAmount,
        total,
        specialInstructions,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        setInstructions,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
