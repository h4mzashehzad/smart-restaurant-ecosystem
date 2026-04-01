'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { CartItem } from '@/types/cart';

const STORAGE_KEY = 'cart_items';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  specialInstructions: string;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  setInstructions: (s: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadPersisted(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    setItems(loadPersisted());
  }, []);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        next = [...prev, { ...item, quantity: 1 }];
      }
      persist(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((id: number, qty: number) => {
    if (qty < 1) return;
    setItems((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
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
