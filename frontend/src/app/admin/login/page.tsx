'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);

  // After login, user context updates — check role here
  useEffect(() => {
    if (!loginAttempted || !user) return;

    if (user.role !== 'admin' && user.role !== 'staff') {
      setError('Access denied. Admin or staff credentials required.');
      setLoading(false);
      return;
    }

    router.push('/admin/kds');
  }, [user, loginAttempted, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoginAttempted(false);

    try {
      await login(email, password);
      setLoginAttempted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-gray-950 relative overflow-hidden">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="w-full max-w-md mx-auto z-10 animate-fade-in-up">
        {/* Kitchen icon */}
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
            <svg
              className="h-8 w-8 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z"
              />
            </svg>
          </div>
        </div>

        <div className="bg-gray-900 py-10 px-6 sm:px-10 rounded-[2rem] shadow-2xl border border-gray-800">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold font-display text-white tracking-tight">
              Kitchen Admin
            </h2>
            <p className="mt-2 text-sm text-gray-400 font-sans">
              Sign in to the Kitchen Display System
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} suppressHydrationWarning>
            {error && (
              <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl border border-red-500/20 text-sm animate-fade-in-up text-center font-medium">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="animate-fade-in-up delay-100">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-gray-800 transition-all sm:text-sm font-medium"
                  placeholder="admin@lahorekarahi.pk"
                  suppressHydrationWarning
                />
              </div>

              <div className="animate-fade-in-up delay-200">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-300 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-gray-800 transition-all sm:text-sm font-medium"
                  placeholder="Enter your password"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="pt-4 animate-fade-in-up delay-300">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-[15px] font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30 active:scale-[0.98] shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {loading ? 'Authenticating...' : 'Sign in to KDS'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
