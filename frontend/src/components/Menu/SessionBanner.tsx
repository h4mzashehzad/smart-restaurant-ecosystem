'use client';

import { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';

export function SessionBanner() {
  const { session, table, restaurant, leaveSession } = useSession();
  const { user } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!session || !table) return null;

  const activeParticipants = session.participants?.filter(p => !p.left_at) ?? [];
  const myName = user?.name ?? 'You (Guest)';

  async function handleLeave() {
    setLeaving(true);
    try {
      await leaveSession();
    } finally {
      setLeaving(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      {/* ── Session Banner ── */}
      <div className="mx-4 my-3 rounded-2xl overflow-hidden">
        {/* Gradient background */}
        <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 p-4 shadow-lg shadow-orange-500/20">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -right-2 w-20 h-20 bg-white/10 rounded-full" />

          <div className="relative flex items-center justify-between gap-3">
            {/* Left: table + restaurant info */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Table icon */}
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-display font-bold text-base leading-tight">
                    Table {table.table_number}
                  </span>
                  {/* Live indicator */}
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-400/30 rounded-full border border-green-400/40">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                    <span className="text-green-200 text-[10px] font-semibold uppercase tracking-wider">Live</span>
                  </span>
                </div>
                <p className="text-white/70 text-xs font-sans mt-0.5 truncate">
                  {restaurant?.name} · Seated as {myName}
                </p>
              </div>
            </div>

            {/* Right: participants + leave button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Participant avatars */}
              <ParticipantAvatars participants={activeParticipants} />

              {/* Leave button */}
              <button
                onClick={() => setShowConfirm(true)}
                aria-label="Leave session"
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center
                           border border-white/30 transition-all active:scale-95"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>

          {/* Participants count bar */}
          {activeParticipants.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-4 h-4 opacity-70 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <span className="text-white/80 text-xs font-sans">
                {activeParticipants.length} {activeParticipants.length === 1 ? 'person' : 'people'} at this table
              </span>
              <div className="ml-auto flex flex-wrap gap-1 max-w-[60%] justify-end">
                {activeParticipants.slice(0, 4).map((p, i) => (
                  <span key={i} className="text-white/60 text-[11px] font-sans">
                    {p.user?.name ?? `Guest ${i + 1}`}
                    {i < Math.min(activeParticipants.length, 4) - 1 ? ',' : ''}
                  </span>
                ))}
                {activeParticipants.length > 4 && (
                  <span className="text-white/60 text-[11px] font-sans">
                    +{activeParticipants.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm Leave Modal ── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className="w-7 h-7 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold text-gray-900">Leave Table {table.table_number}?</h2>
              <p className="text-sm text-gray-500 mt-2 font-sans leading-relaxed">
                You'll leave your current dining session. Your order history will remain intact.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="w-full h-13 py-3.5 bg-red-500 text-white font-semibold rounded-2xl
                           shadow-lg shadow-red-500/20 hover:bg-red-600
                           disabled:opacity-60 disabled:cursor-not-allowed
                           active:scale-[0.98] transition-all"
              >
                {leaving ? 'Leaving…' : 'Yes, Leave Session'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-2xl
                           hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Participant Avatars ───────────────────────────────────────────────────

function ParticipantAvatars({ participants }: { participants: any[] }) {
  const shown = participants.slice(0, 3);
  const extra = participants.length - shown.length;

  const colors = [
    'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
    'bg-pink-500', 'bg-yellow-500',
  ];

  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => {
        const name = p.user?.name ?? `G${i + 1}`;
        const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div
            key={p.id}
            title={name}
            className={`w-8 h-8 rounded-full ${colors[i % colors.length]} border-2 border-white
                        flex items-center justify-center text-white text-[10px] font-bold
                        shadow-sm`}
          >
            {initials}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full bg-white/30 border-2 border-white flex items-center justify-center
                        text-white text-[10px] font-bold">
          +{extra}
        </div>
      )}
    </div>
  );
}
