'use client';

import { useState, useEffect, useRef } from 'react';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface FlaggedItemRating {
  menu_item_name: string | null;
  rating: number;
  review_text: string | null;
  sentiment_label: string | null;
  is_flagged: boolean;
}

export interface FlaggedFeedback {
  feedback_id: number;
  order_id: number;
  restaurant_id: number;
  rating: number;
  review_text: string | null;
  sentiment_label: string | null;
  sentiment_score: number | null;
  flagged_reason: string | null;
  user_name: string;
  table_number: string | null;
  created_at: string;
  item_ratings: FlaggedItemRating[];
}

interface FlaggedFeedbackAlertProps {
  feedback: FlaggedFeedback;
  onDismiss: (feedbackId: number) => void;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const AUTO_DISMISS_MS = 15 * 60 * 1000; // 15 minutes

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill={i < rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={i < rating ? 0 : 1.5}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400' : 'text-gray-500/40'}`}
        >
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export default function FlaggedFeedbackAlert({ feedback, onDismiss }: FlaggedFeedbackAlertProps) {
  const [expanded, setExpanded] = useState(false);
  const [remaining, setRemaining] = useState(AUTO_DISMISS_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 15-minute auto-dismiss countdown
  useEffect(() => {
    const createdAt = feedback.created_at ? new Date(feedback.created_at).getTime() : Date.now();
    const expiresAt = createdAt + AUTO_DISMISS_MS;

    function tick() {
      const ms = expiresAt - Date.now();
      if (ms <= 0) {
        setRemaining(0);
        onDismiss(feedback.feedback_id);
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        setRemaining(ms);
      }
    }

    tick(); // initial
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [feedback.created_at, feedback.feedback_id, onDismiss]);

  const flaggedItems = feedback.item_ratings?.filter((ir) => ir.is_flagged) ?? [];
  const hasItemDetails = feedback.item_ratings && feedback.item_ratings.length > 0;

  return (
    <div
      className="relative rounded-2xl border-2 border-red-400/60 bg-red-950/40 p-4 flex flex-col gap-3
                 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse-slow transition-all duration-300"
    >
      {/* Header: Table badge + user + stars */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Table number badge — prominent */}
          {feedback.table_number && (
            <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-red-500 uppercase tracking-wide shadow-sm">
              Table {feedback.table_number}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">
              {feedback.user_name}
            </p>
          </div>
        </div>
        <StarDisplay rating={feedback.rating} />
      </div>

      {/* Overall review text */}
      {feedback.review_text && (
        <div>
          <p
            className={`text-sm text-gray-300 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}
          >
            &ldquo;{feedback.review_text}&rdquo;
          </p>
          {feedback.review_text.length > 100 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-red-300/80 hover:text-red-200 font-medium mt-0.5 transition-colors"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Flagged items */}
      {hasItemDetails && flaggedItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-red-300/70 uppercase tracking-wider">
            Flagged Items
          </p>
          {flaggedItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-red-900/30 rounded-xl px-3 py-2 border border-red-500/20"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-200 truncate">
                    {item.menu_item_name ?? 'Unknown item'}
                  </span>
                  <StarDisplay rating={item.rating} />
                </div>
                {item.review_text && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    &ldquo;{item.review_text}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badges: sentiment + flag reason */}
      <div className="flex flex-wrap items-center gap-1.5">
        {feedback.sentiment_label && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                       ${feedback.sentiment_label === 'negative'
                ? 'bg-red-500/30 text-red-300 border border-red-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
          >
            {feedback.sentiment_label}
          </span>
        )}
        {feedback.flagged_reason && (
          <span className="text-[10px] font-medium text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded-full border border-gray-700/40 truncate max-w-[200px]">
            {feedback.flagged_reason}
          </span>
        )}
      </div>

      {/* Footer: countdown + dismiss */}
      <div className="flex items-center justify-between pt-1 border-t border-red-500/15">
        <span className="text-[10px] font-semibold text-red-400/60 uppercase tracking-wide">
          Auto-dismiss in {formatCountdown(remaining)}
        </span>
        <button
          onClick={() => onDismiss(feedback.feedback_id)}
          className="text-xs font-semibold text-gray-400 hover:text-white px-2.5 py-1 rounded-lg
                     hover:bg-red-500/20 transition-all active:scale-95"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
