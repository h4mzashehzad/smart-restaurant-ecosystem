'use client';

import { useCallback, useEffect, useState } from 'react';
import { Portal } from '@/components/Portal';
import { api } from '@/lib/api';

interface LoyaltyDashboardDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface LoyaltySnapshot {
  loyalty_points: number;
  loyalty_tier: string;
  current_tier: {
    name: string;
    discount_percent: number;
    min_order_subtotal: number;
    min_points: number;
  };
  next_tier: {
    name: string;
    points_needed: number;
    min_points: number;
  } | null;
  progress_percent: number;
}

interface LoyaltyTransactionRow {
  id: number;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  order?: { order_number?: string } | null;
}

const TIER_STYLES: Record<string, { badge: string; ring: string; label: string }> = {
  bronze: {
    badge: 'bg-amber-100 text-amber-800',
    ring: 'from-amber-400 to-orange-500',
    label: 'Bronze',
  },
  silver: {
    badge: 'bg-slate-200 text-slate-700',
    ring: 'from-slate-400 to-slate-500',
    label: 'Silver',
  },
  gold: {
    badge: 'bg-yellow-100 text-yellow-800',
    ring: 'from-yellow-400 to-amber-500',
    label: 'Gold',
  },
};

function formatTier(tier: string) {
  return TIER_STYLES[tier]?.label ?? tier.charAt(0).toUpperCase() + tier.slice(1);
}

function typeBadge(type: string) {
  switch (type) {
    case 'earned':
      return 'bg-emerald-50 text-emerald-700';
    case 'redeemed':
      return 'bg-orange-50 text-orange-700';
    case 'adjusted':
      return 'bg-amber-50 text-amber-700';
    case 'expired':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function LoyaltyDashboardDrawer({ open, onClose }: LoyaltyDashboardDrawerProps) {
  const [snapshot, setSnapshot] = useState<LoyaltySnapshot | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransactionRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [snap, tx] = await Promise.all([
        api.getLoyaltySnapshot(),
        api.getLoyaltyTransactions(1),
      ]);
      setSnapshot(snap);
      const rows = (tx?.data ?? tx ?? []) as LoyaltyTransactionRow[];
      setTransactions(Array.isArray(rows) ? rows : []);
      setPage(1);
      setHasMore(Boolean(tx?.next_page_url || (tx?.current_page ?? 1) < (tx?.last_page ?? 1)));
    } catch {
      setError('Could not load your loyalty dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [open]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const tx = await api.getLoyaltyTransactions(next);
      const rows = (tx?.data ?? []) as LoyaltyTransactionRow[];
      setTransactions((prev) => [...prev, ...rows]);
      setPage(next);
      setHasMore(Boolean(tx?.next_page_url || next < (tx?.last_page ?? next)));
    } catch {
      // keep existing list
    } finally {
      setLoadingMore(false);
    }
  }

  if (!open) return null;

  const tier = snapshot?.loyalty_tier ?? 'bronze';
  const style = TIER_STYLES[tier] ?? TIER_STYLES.bronze;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70]">
        <div className="animate-slide-up bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90dvh]">
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Loyalty Rewards</h2>
              <p className="text-xs text-gray-400 font-sans mt-0.5">
                Track your tier, points, and history
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close loyalty dashboard"
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {loading && (
              <div className="py-16 text-center">
                <div className="w-10 h-10 mx-auto border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-sans mt-3">Loading rewards…</p>
              </div>
            )}

            {error && !loading && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 space-y-2">
                <p className="text-sm font-sans text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="text-xs font-semibold text-red-700 underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && snapshot && (
              <>
                <div
                  className={`rounded-3xl bg-gradient-to-br ${style.ring} p-[1px] shadow-lg shadow-orange-500/10`}
                >
                  <div className="rounded-[1.4rem] bg-white px-4 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] font-sans font-semibold text-orange-500/80">
                          Current tier
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${style.badge}`}
                          >
                            {formatTier(tier)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wider font-sans font-semibold text-gray-400">
                          Points
                        </p>
                        <p className="font-display text-3xl font-bold text-gray-900 leading-none mt-1">
                          {snapshot.loyalty_points.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {snapshot.next_tier ? (
                      <div className="mt-5 space-y-2">
                        <div className="flex justify-between text-xs font-sans text-gray-500">
                          <span>
                            {snapshot.next_tier.points_needed.toLocaleString()} pts to{' '}
                            {formatTier(snapshot.next_tier.name)}
                          </span>
                          <span>{snapshot.progress_percent}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
                            style={{ width: `${Math.min(100, snapshot.progress_percent)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs font-sans text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        You&apos;ve reached Gold — enjoy maximum rewards.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-wider font-sans font-bold text-orange-600/80">
                    Your benefit
                  </p>
                  <p className="mt-1 font-display font-bold text-gray-900 text-base">
                    {snapshot.current_tier.discount_percent}% off orders over Rs{' '}
                    {snapshot.current_tier.min_order_subtotal.toLocaleString('en-PK')}
                  </p>
                  <p className="mt-1 text-xs font-sans text-gray-500 leading-relaxed">
                    Applied automatically at checkout when you&apos;re signed in. Earn 1 point for
                    every Rs 20 spent (after discount).
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-display font-bold text-gray-900 text-sm">Points history</h3>
                    <button
                      type="button"
                      onClick={() => void load()}
                      className="text-[11px] font-sans font-semibold text-orange-600"
                    >
                      Refresh
                    </button>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center">
                      <p className="font-display font-bold text-gray-400 text-sm">No points yet</p>
                      <p className="text-xs font-sans text-gray-400 mt-1">
                        Place an order while signed in to start earning.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {transactions.map((tx) => (
                        <li
                          key={tx.id}
                          className="rounded-2xl border border-gray-100 bg-white px-3.5 py-3 flex items-start gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeBadge(tx.transaction_type)}`}
                              >
                                {tx.transaction_type}
                              </span>
                              <span className="text-[11px] font-sans text-gray-400">
                                {tx.created_at
                                  ? new Date(tx.created_at).toLocaleString('en-PK', {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })
                                  : '—'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-sans text-gray-700 leading-snug">
                              {tx.description || 'Loyalty update'}
                            </p>
                            <p className="mt-0.5 text-[11px] font-sans text-gray-400">
                              Balance · {tx.balance_after.toLocaleString()} pts
                            </p>
                          </div>
                          <span
                            className={`shrink-0 font-display font-bold text-sm ${
                              tx.points >= 0 ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            {tx.points >= 0 ? '+' : ''}
                            {tx.points.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {hasMore && (
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => void loadMore()}
                      className="mt-3 w-full py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
