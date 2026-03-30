'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type ScanState = 'loading' | 'auth_prompt' | 'confirm_leave' | 'joining' | 'error';

interface TableInfo {
  id: number;
  table_number: string;
  restaurant_id: number;
}

export default function ScanPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const { session, scanAndJoin, leaveSession } = useSession();
  const { user, loading: authLoading } = useAuth();

  const [scanState, setScanState] = useState<ScanState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [incomingTable, setIncomingTable] = useState<TableInfo | null>(null);

  // Once auth state resolves, decide what to show
  useEffect(() => {
    if (authLoading) return; // wait until auth is known
    if (!token) {
      setErrorMsg('No QR token found in URL.');
      setScanState('error');
      return;
    }
    checkTable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading]);

  async function checkTable() {
    setScanState('loading');
    try {
      const data = await api.scanTable(token);
      setIncomingTable(data.table);

      // If user is already in a different active session, ask to leave
      if (session && session.table_id !== data.table.id) {
        setScanState('confirm_leave');
        return;
      }

      // If user is a guest, show the auth prompt first
      if (!user) {
        setScanState('auth_prompt');
        return;
      }

      // Logged-in, no conflict — join directly
      await doJoin();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid or expired QR code.';
      setErrorMsg(msg);
      setScanState('error');
    }
  }

  async function doJoin() {
    setScanState('joining');
    try {
      await scanAndJoin(token);
      router.replace('/menu');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not join the session. Please try again.';
      setErrorMsg(msg);
      setScanState('error');
    }
  }

  /** Guest chose to continue without logging in */
  async function handleContinueAsGuest() {
    await doJoin();
  }

  /** Guest chose to login — redirect with return URL so login page bounces back here */
  function handleGoToLogin() {
    router.push(`/login?redirect=/scan/${token}`);
  }

  /** Guest chose to register */
  function handleGoToRegister() {
    router.push(`/register?redirect=/scan/${token}`);
  }

  async function handleConfirmLeave() {
    setScanState('joining');
    await leaveSession();
    await doJoin();
  }

  function handleCancelLeave() {
    router.replace('/menu');
  }

  // ── Renders ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Loading / Joining spinner */}
        {(scanState === 'loading' || scanState === 'joining') && (
          <div className="flex flex-col items-center gap-6 text-center animate-fade-in-up">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75V16.5zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 18.75h.75v.75h-.75v-.75zM18.75 13.5h.75v.75h-.75v-.75zM18.75 18.75h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-3xl bg-orange-500/20 animate-ping" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                {scanState === 'loading' ? 'Reading Table…' : 'Joining Session…'}
              </h1>
              <p className="text-sm text-gray-400 mt-2 font-sans">
                {scanState === 'loading' ? 'Verifying your table QR code' : 'Setting up your dining session'}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-dot-bounce-0" />
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-dot-bounce-1" />
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-dot-bounce-2" />
            </div>
          </div>
        )}

        {/* Auth Prompt */}
        {scanState === 'auth_prompt' && incomingTable && (
          <div className="flex flex-col gap-5 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-orange-100 flex items-center justify-center border border-orange-200 shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="w-10 h-10 text-orange-500">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                  Table {incomingTable.table_number} 🍽️
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-sans leading-relaxed max-w-xs mx-auto">
                  Log in to track your orders, earn loyalty points, and personalise your experience. Or continue as a guest.
                </p>
              </div>
            </div>

            {/* Auth buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoToLogin}
                className="w-full h-14 bg-orange-500 text-white font-semibold rounded-2xl
                           shadow-lg shadow-orange-500/25 hover:bg-orange-600
                           active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Log In
              </button>

              <button
                onClick={handleGoToRegister}
                className="w-full h-14 bg-white text-gray-800 font-semibold rounded-2xl
                           border border-gray-200 hover:bg-gray-50 hover:border-orange-200
                           active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
                Create an Account
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                onClick={handleContinueAsGuest}
                className="w-full h-12 text-gray-500 font-medium text-sm rounded-2xl
                           hover:bg-gray-100 active:scale-[0.98] transition-all duration-200"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        )}

        {/* Confirm Leave */}
        {scanState === 'confirm_leave' && session && (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center border border-amber-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="w-10 h-10 text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                  You&apos;re Already Seated
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-sans leading-relaxed max-w-xs mx-auto">
                  You&apos;re currently at{' '}
                  <span className="font-semibold text-gray-700">Table {(session as any).table?.table_number}</span>
                  . Leave that session and join{' '}
                  <span className="font-semibold text-gray-700">Table {incomingTable?.table_number}</span>?
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmLeave}
                className="w-full h-14 bg-orange-500 text-white font-semibold rounded-2xl
                           shadow-lg shadow-orange-500/25 hover:bg-orange-600
                           active:scale-[0.98] transition-all duration-200"
              >
                Leave &amp; Join Table {incomingTable?.table_number}
              </button>
              <button
                onClick={handleCancelLeave}
                className="w-full h-14 bg-white text-gray-700 font-semibold rounded-2xl
                           border border-gray-200 hover:bg-gray-50
                           active:scale-[0.98] transition-all duration-200"
              >
                Stay at Table {(session as any).table?.table_number}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {scanState === 'error' && (
          <div className="flex flex-col items-center gap-6 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center border border-red-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                className="w-10 h-10 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">Couldn&apos;t Join</h1>
              <p className="text-sm text-gray-500 mt-2 font-sans leading-relaxed max-w-xs mx-auto">{errorMsg}</p>
            </div>
            <button
              onClick={checkTable}
              className="h-12 px-8 bg-orange-500 text-white font-semibold rounded-2xl
                         shadow-md shadow-orange-500/20 hover:bg-orange-600 active:scale-[0.98] transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
