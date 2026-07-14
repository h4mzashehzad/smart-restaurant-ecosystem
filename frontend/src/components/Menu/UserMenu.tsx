'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/contexts/SessionContext';
import { LoyaltyDashboardDrawer } from '@/components/Menu/LoyaltyDashboardDrawer';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { session, leaveSession } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // If in a session, leave it first so the participant is cleaned up
      if (session) await leaveSession();
      await logout();
      router.push('/login');
    } finally {
      setLoggingOut(false);
      setOpen(false);
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : null;

  return (
    <>
      <div className="relative shrink-0" ref={menuRef}>
        {/* Trigger button */}
        <button
          id="user-menu-button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="true"
          className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all
                      active:scale-95 shadow-inner
                      ${user
                        ? 'bg-orange-500 border-orange-400 shadow-orange-500/20'
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                      }`}
        >
          {user && initials ? (
            <span className="text-white font-display font-bold text-sm">{initials}</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          )}
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            className="absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden animate-fade-in-up"
            style={{ animationDuration: '0.2s' }}
          >
            {user ? (
              /* ── Logged-in user view ── */
              <>
                {/* Profile header */}
                <div className="px-4 py-4 bg-gradient-to-br from-orange-50 to-amber-50 border-b border-orange-100/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                      <span className="text-white font-display font-bold text-sm">{initials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-gray-900 text-sm truncate">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-gray-500 font-sans truncate mt-0.5">{user.email}</p>
                      )}
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                        {user.loyalty_tier ?? 'Member'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Loyalty points */}
                {user.loyalty_points !== undefined && (
                  <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-amber-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-sans">Loyalty Points</p>
                      <p className="font-display font-bold text-gray-900 text-sm">{user.loyalty_points.toLocaleString()} pts</p>
                    </div>
                  </div>
                )}

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setLoyaltyOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                               text-gray-800 hover:bg-orange-50 hover:text-orange-600
                               transition-colors text-left"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0 text-orange-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18.75" />
                    </svg>
                    <span className="text-sm font-semibold">Loyalty Dashboard</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500
                               hover:bg-red-50 transition-colors text-left
                               disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span className="text-sm font-semibold">{loggingOut ? 'Signing out…' : 'Sign Out'}</span>
                  </button>
                </div>
              </>
            ) : (
              /* ── Guest view ── */
              <>
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <p className="font-display font-bold text-gray-900 text-sm">Welcome, Guest</p>
                  <p className="text-xs text-gray-500 font-sans mt-1">Sign in to earn loyalty points and track your orders.</p>
                </div>

                <div className="p-2 flex flex-col gap-1">
                  <button
                    onClick={() => { setOpen(false); router.push('/login'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                               text-gray-800 hover:bg-orange-50 hover:text-orange-600
                               transition-colors text-left"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0 text-orange-500">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span className="text-sm font-semibold">Log In</span>
                  </button>

                  <button
                    onClick={() => { setOpen(false); router.push('/register'); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                               text-gray-800 hover:bg-orange-50 hover:text-orange-600
                               transition-colors text-left"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 shrink-0 text-orange-500">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                    <span className="text-sm font-semibold">Create Account</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <LoyaltyDashboardDrawer open={loyaltyOpen} onClose={() => setLoyaltyOpen(false)} />
    </>
  );
}
