'use client';

import { useState, useEffect, useCallback } from 'react';
import { Portal } from '@/components/Portal';
import { useSession } from '@/contexts/SessionContext';
import { api } from '@/lib/api';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface OrderMenuItem {
  id: number;
  menu_item_id: number;
  quantity: number;
  menu_item: { id: number; name: string; image_url?: string };
}

interface OrderDetail {
  id: number;
  order_number: string;
  restaurant_id: number;
  items: OrderMenuItem[];
}

interface ItemReview {
  menu_item_id: number;
  rating: number;
  review_text: string;
}

type DrawerState = 'idle' | 'open' | 'submitting' | 'success';

/* ── Star Selector Component ────────────────────────────────────────────────── */

function StarSelector({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange: (v: number) => void;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`${dim} transition-all duration-150 active:scale-110
                     ${star <= value ? 'text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.4)]' : 'text-gray-200'}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* ── Feedback Drawer ────────────────────────────────────────────────────────── */

export function FeedbackDrawer() {
  const { servedOrders, dismissServedOrder, restaurant, endSession } = useSession();

  const [state, setState] = useState<DrawerState>('idle');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [overallRating, setOverallRating] = useState(0);
  const [overallText, setOverallText] = useState('');
  const [itemReviews, setItemReviews] = useState<ItemReview[]>([]);
  const [error, setError] = useState('');

  // Pick the first served order to show feedback for
  const currentServed = servedOrders[0] ?? null;

  // Fetch order details when a served order appears
  useEffect(() => {
    if (!currentServed) {
      setState('idle');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await api.getOrder(currentServed.orderId);
        if (cancelled) return;
        setOrder(data);
        setOverallRating(0);
        setOverallText('');
        setItemReviews(
          (data.items || []).map((item: OrderMenuItem) => ({
            menu_item_id: item.menu_item?.id ?? item.menu_item_id,
            rating: 0,
            review_text: '',
          }))
        );
        setState('open');
      } catch {
        // Order fetch failed — still show the drawer with no items
        if (!cancelled) setState('open');
      }
    })();

    return () => { cancelled = true; };
  }, [currentServed]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (state === 'open' || state === 'submitting') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [state]);

  const updateItemRating = useCallback((menuItemId: number, rating: number) => {
    setItemReviews((prev) =>
      prev.map((ir) => (ir.menu_item_id === menuItemId ? { ...ir, rating } : ir))
    );
  }, []);

  const updateItemText = useCallback((menuItemId: number, text: string) => {
    setItemReviews((prev) =>
      prev.map((ir) => (ir.menu_item_id === menuItemId ? { ...ir, review_text: text } : ir))
    );
  }, []);

  const handleSkip = useCallback(async () => {
    if (currentServed) dismissServedOrder(currentServed.orderId);
    setState('idle');
    setOrder(null);
    try {
      await endSession();
    } catch (e) {
      console.error('Failed to end session on skip', e);
    }
  }, [currentServed, dismissServedOrder, endSession]);

  const handleSubmit = useCallback(async () => {
    if (!order || !restaurant) return;
    if (overallRating === 0) {
      setError('Please select an overall rating.');
      return;
    }

    setError('');
    setState('submitting');

    try {
      const ratedItems = itemReviews
        .filter((ir) => ir.rating > 0 || ir.review_text.trim().length > 0)
        .map((ir) => ({
          menu_item_id: ir.menu_item_id,
          rating: ir.rating || overallRating, // default to overall if not set
          review_text: ir.review_text.trim() || undefined,
        }));

      await api.submitFeedback({
        restaurant_id: restaurant.id,
        order_id: order.id,
        rating: overallRating,
        review_text: overallText.trim() || undefined,
        item_ratings: ratedItems.length > 0 ? ratedItems : undefined,
      });

      setState('success');
      setTimeout(async () => {
        if (currentServed) dismissServedOrder(currentServed.orderId);
        setState('idle');
        setOrder(null);
        try {
          await endSession();
        } catch (e) {
          console.error('Failed to end session on submit', e);
        }
      }, 2000);
    } catch {
      setError('Failed to submit feedback. Please try again.');
      setState('open');
    }
  }, [order, restaurant, overallRating, overallText, itemReviews, currentServed, dismissServedOrder, endSession]);

  if (state === 'idle') return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={state === 'open' ? handleSkip : undefined}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70]">
        <div className="animate-slide-up bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85dvh]">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* ── Success state ──────────────────────────────────────── */}
          {state === 'success' ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5 animate-[scale-in_0.3s_ease-out]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10 text-emerald-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                Thank you! 🎉
              </h2>
              <p className="text-sm font-sans text-gray-500">
                Your feedback helps us serve you better.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                <div>
                  <h2 className="text-xl font-display font-bold text-gray-900">
                    How was your meal?
                  </h2>
                  {order && (
                    <p className="text-xs font-sans text-gray-400 mt-0.5">
                      Order {order.order_number}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSkip}
                  disabled={state === 'submitting'}
                  className="text-xs font-sans font-semibold text-gray-400 hover:text-gray-600 transition-colors
                             px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  Maybe Later
                </button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
                {/* Overall rating */}
                <div className="text-center">
                  <p className="text-sm font-sans font-semibold text-gray-600 mb-2">
                    Overall Experience
                  </p>
                  <div className="flex justify-center">
                    <StarSelector value={overallRating} onChange={setOverallRating} />
                  </div>
                  {overallRating > 0 && (
                    <p className="text-xs font-sans text-gray-400 mt-1.5">
                      {overallRating <= 2 ? "We're sorry to hear that" : overallRating <= 3 ? 'Thanks for your honesty' : overallRating <= 4 ? 'Glad you enjoyed it!' : 'Amazing! Thank you!'}
                    </p>
                  )}
                </div>

                {/* Overall text review */}
                <div>
                  <label className="text-xs font-sans font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Tell us more (optional)
                  </label>
                  <textarea
                    value={overallText}
                    onChange={(e) => setOverallText(e.target.value)}
                    placeholder="How was your dining experience?"
                    rows={2}
                    maxLength={2000}
                    disabled={state === 'submitting'}
                    className="w-full text-sm font-sans text-gray-700 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3 resize-none
                               focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15
                               transition-all placeholder:text-gray-300 disabled:opacity-50"
                  />
                </div>

                {/* Per-item reviews */}
                {order && order.items && order.items.length > 0 && (
                  <div>
                    <p className="text-xs font-sans font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Rate each dish
                    </p>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => {
                        const review = itemReviews.find((ir) => ir.menu_item_id === (item.menu_item?.id ?? item.menu_item_id));
                        return (
                          <div
                            key={item.id}
                            className="bg-gray-50/80 border border-gray-100 rounded-2xl px-4 py-3 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-sans font-semibold text-gray-800 truncate">
                                  {item.quantity > 1 && (
                                    <span className="text-gray-400 mr-1">{item.quantity}×</span>
                                  )}
                                  {item.menu_item?.name ?? 'Menu Item'}
                                </p>
                              </div>
                              <StarSelector
                                value={review?.rating ?? 0}
                                onChange={(v) => updateItemRating(item.menu_item?.id ?? item.menu_item_id, v)}
                                size="sm"
                              />
                            </div>
                            <textarea
                              value={review?.review_text ?? ''}
                              onChange={(e) => updateItemText(item.menu_item?.id ?? item.menu_item_id, e.target.value)}
                              placeholder="What did you think of this dish?"
                              rows={1}
                              maxLength={500}
                              disabled={state === 'submitting'}
                              className="w-full text-xs font-sans text-gray-600 bg-white border border-gray-150 rounded-xl px-3 py-2 resize-none
                                         focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/15
                                         transition-all placeholder:text-gray-300 disabled:opacity-50"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pt-3 pb-5 border-t border-gray-100 shrink-0 bg-white space-y-3">
                {error && (
                  <p className="text-xs text-red-500 font-sans bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={state === 'submitting' || overallRating === 0}
                  className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl
                             shadow-lg shadow-orange-500/25 hover:bg-orange-600
                             disabled:opacity-60 disabled:cursor-not-allowed
                             active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {state === 'submitting' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
