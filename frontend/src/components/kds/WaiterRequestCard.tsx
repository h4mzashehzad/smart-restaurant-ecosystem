'use client';

import { useState, useEffect } from 'react';
import { socketClient } from '@/lib/socket';

// ── Types ──────────────────────────────────────────────────────────────────

export interface WaiterRequest {
  id: number;
  request_type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message?: string | null;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'cancelled';
  table?: { table_number: string } | null;
  created_at: string;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
}

interface WaiterRequestCardProps {
  request: WaiterRequest;
  onResolved?: (id: number) => void;
}

// ── Config ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; iconPath: string }> = {
  waiter_call:  { label: 'Call Waiter',   iconPath: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
  bill_request: { label: 'Request Bill',  iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
  water_refill: { label: 'Water Refill',  iconPath: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' },
  cutlery:      { label: 'Need Cutlery',  iconPath: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37' },
  complaint:    { label: 'Complaint',     iconPath: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
  other:        { label: 'Other',         iconPath: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-500 text-white',
  high:   'bg-orange-500 text-white',
  medium: 'bg-amber-400 text-white',
  low:    'bg-gray-400 text-white',
};

const STATUS_BADGE: Record<string, string> = {
  pending:      'bg-gray-700/60 text-gray-300',
  acknowledged: 'bg-blue-500/20 text-blue-300',
  in_progress:  'bg-violet-500/20 text-violet-300',
  resolved:     'bg-green-500/20 text-green-300',
  cancelled:    'bg-red-500/20 text-red-300',
};

function getElapsed(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function WaiterRequestCard({ request, onResolved }: WaiterRequestCardProps) {
  const [elapsed, setElapsed] = useState(() => getElapsed(request.created_at));
  const [resolving, setResolving] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const typeConfig = TYPE_CONFIG[request.request_type] ?? { label: request.request_type, iconPath: TYPE_CONFIG.other.iconPath };

  // Update elapsed time every 30s
  useEffect(() => {
    const t = setInterval(() => setElapsed(getElapsed(request.created_at)), 30000);
    return () => clearInterval(t);
  }, [request.created_at]);

  // Auto-exit resolved cards after 5s
  useEffect(() => {
    if (request.status === 'resolved') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onResolved?.(request.id), 400);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [request.status, request.id, onResolved]);

  function handleAcknowledge() {
    setAcknowledging(true);
    socketClient.acknowledgeWaiterRequest(request.id);
    // Optimistic feedback — the socket:update will confirm
    setTimeout(() => setAcknowledging(false), 1500);
  }

  function handleResolve() {
    setResolving(true);
    socketClient.resolveWaiterRequest(request.id);
    setTimeout(() => setResolving(false), 1500);
  }

  const isResolved = request.status === 'resolved' || request.status === 'cancelled';

  return (
    <div
      className={`rounded-2xl border bg-gray-800/80 border-gray-700/60 p-4 flex flex-col gap-3
                  shadow-lg transition-all duration-300
                  ${request.priority === 'urgent' ? 'border-red-500/50 bg-red-950/30 animate-pulse' : ''}
                  ${isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Violet accent icon */}
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
              className="w-4.5 h-4.5 text-violet-400" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d={typeConfig.iconPath} />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white font-display leading-tight truncate">{typeConfig.label}</p>
            <p className="text-[11px] text-gray-400 font-sans mt-0.5">
              {request.table ? `Table ${request.table.table_number}` : 'Unknown table'}
              <span className="mx-1.5 text-gray-600">·</span>
              {elapsed}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${PRIORITY_BADGE[request.priority] ?? PRIORITY_BADGE.medium}`}>
            {request.priority}
          </span>
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_BADGE[request.status] ?? STATUS_BADGE.pending}`}>
            {request.status}
          </span>
        </div>
      </div>

      {/* Message */}
      {request.message && (
        <div className="bg-gray-700/40 rounded-xl px-3 py-2 border border-gray-700/50">
          <p className="text-xs text-gray-300 font-sans leading-relaxed italic">"{request.message}"</p>
        </div>
      )}

      {/* Resolved notice */}
      {isResolved && (
        <div className="flex items-center gap-2 text-green-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-semibold">Resolved — removing shortly…</p>
        </div>
      )}

      {/* Action buttons */}
      {!isResolved && (
        <div className="flex gap-2 mt-auto">
          {request.status === 'pending' && (
            <button
              id={`waiter-ack-${request.id}`}
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-blue-300 bg-blue-500/15
                         border border-blue-500/25 hover:bg-blue-500/25 transition-all
                         disabled:opacity-50 active:scale-[0.97] cursor-pointer"
            >
              {acknowledging ? 'Acknowledging…' : 'Acknowledge'}
            </button>
          )}
          <button
            id={`waiter-resolve-${request.id}`}
            onClick={handleResolve}
            disabled={resolving}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-violet-200 bg-violet-500/20
                       border border-violet-500/30 hover:bg-violet-500/30 transition-all
                       disabled:opacity-50 active:scale-[0.97] cursor-pointer"
          >
            {resolving ? 'Resolving…' : 'Resolve'}
          </button>
        </div>
      )}
    </div>
  );
}
