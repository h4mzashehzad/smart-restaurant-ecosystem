'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient } from '@/lib/socket';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'customer' | 'staff' | 'admin';
  loyalty_tier: string;
  loyalty_points: number;
  restaurant_id: number | null;
  is_active?: boolean;
  admin_onboarding?: { version: number; step: number; status: 'pending' | 'active' | 'skipped' | 'completed' } | null;
  restaurant?: {
    id: number;
    name: string;
    slug: string;
    is_active?: boolean;
  } | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (
    data: RegisterPayload
  ) => Promise<{ success: boolean; require_otp?: boolean; data?: { user: User; token: string } }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  completeRestaurantRegistration: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void checkAuth();
    const syncIdentity = (event: StorageEvent) => {
      if (event.key !== 'auth_token') return;
      queryClient.clear();
      socketClient.resetKitchen();
      setUser(null);
      setLoading(true);
      void checkAuth();
    };
    window.addEventListener('storage', syncIdentity);
    return () => window.removeEventListener('storage', syncIdentity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const userData = await api.getMe();
        if (localStorage.getItem('auth_token') === token) setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    const response = await api.login(identifier, password);
    // api.login() returns the JSON body: { success, data: { user, token } }
    queryClient.clear();
    socketClient.resetKitchen();
    setUser(response.data.user);
    return response.data.user as User;
  };

  const logout = async () => {
    try { await api.logout(); } finally {
      localStorage.removeItem('auth_token');
      queryClient.clear();
      socketClient.resetKitchen();
      setUser(null);
    }
  };

  const register = async (data: RegisterPayload) => {
    const response = await api.register(data);
    return response;
  };

  const verifyOtp = async (email: string, otp: string) => {
    const response = await api.verifyOtp(email, otp);
    setUser(response.data.user);
  };

  const completeRestaurantRegistration = (nextUser: User, token: string) => {
    localStorage.setItem('auth_token', token);
    queryClient.clear();
    socketClient.resetKitchen();
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, verifyOtp, completeRestaurantRegistration }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
