'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import KDSOrderTicket from '@/components/kds/KDSOrderTicket';
import WaiterRequestCard, { WaiterRequest } from '@/components/kds/WaiterRequestCard';
import FlaggedFeedbackAlert, { type FlaggedFeedback } from '@/components/kds/FlaggedFeedbackAlert';

interface KDSOrder {
  id: number;
  order_number: string;
  status: string;
  placed_at: string;
  estimated_completion_at: string;
  table: { table_number: string } | null;
  items: Array<{
    id: number;
    quantity: number;
    menu_item: { name: string; preparation_time?: number };
    customization_notes?: string;
  }>;
  special_instructions?: string;
  user?: { name: string } | null;
}

const RESTAURANT_ID = 1;

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function sortRequests(requests: WaiterRequest[]): WaiterRequest[] {
  return [...requests].sort((a, b) => {
    const pd = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    if (pd !== 0) return pd;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

export default function KDSContainer() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [serviceRequests, setServiceRequests] = useState<WaiterRequest[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flaggedFeedback, setFlaggedFeedback] = useState<FlaggedFeedback[]>([]);
  const mountedRef = useRef(true);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  // Fetch initial orders from REST API
  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getActiveKitchenOrders(RESTAURANT_ID);
      if (mountedRef.current) setOrders(data ?? []);
    } catch (err) {
      console.error('Failed to fetch active orders:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  // Socket setup
  useEffect(() => {
    if (authLoading || !user) return;

    mountedRef.current = true;
    fetchOrders();

    socketClient.connect();
    socketClient.joinKitchen(RESTAURANT_ID);

    const handleConnect    = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    socketClient.onConnect(handleConnect);
    socketClient.onDisconnect(handleDisconnect);

    // ── Food orders ──────────────────────────────────────────────────────

    socketClient.onKitchenInitialOrders((initialOrders: KDSOrder[]) => {
      if (!mountedRef.current) return;
      if (initialOrders?.length > 0) {
        setOrders((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          return [...prev, ...initialOrders.filter((o) => !existingIds.has(o.id))];
        });
      }
    });

    socketClient.onOrderCreated((data: any) => {
      if (!mountedRef.current) return;
      const order = data.order ?? data;
      if (order.restaurant_id !== RESTAURANT_ID) return;
      setOrders((prev) => prev.some((o) => o.id === order.id) ? prev : [order, ...prev]);
    });

    socketClient.onOrderStatusChanged((data: any) => {
      if (!mountedRef.current) return;
      const { order_id, status } = data;
      if (['served', 'completed', 'cancelled'].includes(status)) {
        setOrders((prev) => prev.filter((o) => o.id !== order_id));
      } else {
        setOrders((prev) => prev.map((o) => (o.id === order_id ? { ...o, status } : o)));
      }
    });

    // ── Service / waiter requests ────────────────────────────────────────

    socketClient.onKitchenInitialServiceRequests((initial: WaiterRequest[]) => {
      if (!mountedRef.current) return;
      if (initial?.length > 0) setServiceRequests(initial.filter((r) => r.status !== 'resolved'));
    });

    socketClient.onWaiterRequestNew((request: WaiterRequest) => {
      if (!mountedRef.current) return;
      setServiceRequests((prev) => prev.some((r) => r.id === request.id) ? prev : [request, ...prev]);
    });

    socketClient.onWaiterRequestUpdated((data: any) => {
      if (!mountedRef.current) return;
      const { requestId, status, acknowledgedAt, resolvedAt } = data;
      setServiceRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status, acknowledged_at: acknowledgedAt, resolved_at: resolvedAt } : r
        )
      );
    });

    // ── Flagged feedback alerts ──────────────────────────────────────

    socketClient.onKitchenInitialFlaggedFeedback((initial: FlaggedFeedback[]) => {
      if (mountedRef.current) setFlaggedFeedback(initial ?? []);
    });

    socketClient.onFeedbackFlagged((feedback: FlaggedFeedback) => {
      if (!mountedRef.current) return;
      setFlaggedFeedback((prev) =>
        prev.some((f) => f.feedback_id === feedback.feedback_id)
          ? prev
          : [feedback, ...prev]
      );
    });

    socketClient.onFeedbackFlagDismissed((data: { feedbackId: number }) => {
      if (!mountedRef.current) return;
      setFlaggedFeedback((prev) => prev.filter((f) => f.feedback_id !== data.feedbackId));
    });

    setConnected(socketClient.isConnected());

    return () => {
      mountedRef.current = false;
      socketClient.offOrderCreated();
      socketClient.offOrderStatusChanged();
      socketClient.offKitchenInitialOrders();
      socketClient.offKitchenInitialServiceRequests();
      socketClient.offWaiterRequestNew();
      socketClient.offWaiterRequestUpdated();
      socketClient.offFeedbackFlagged();
      socketClient.offKitchenInitialFlaggedFeedback();
      socketClient.offFeedbackFlagDismissed();
      socketClient.disconnect();
    };
  }, [authLoading, user, fetchOrders]);

  const handleStatusUpdate = useCallback((orderId: number, status: string) => {
    socketClient.updateOrderStatus(orderId, status);
    if (['served', 'completed', 'cancelled'].includes(status)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    }
  }, []);

  const handleRequestResolved = useCallback((id: number) => {
    setServiceRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleDismissFeedback = useCallback((feedbackId: number) => {
    socketClient.dismissFeedbackFlag(feedbackId, RESTAURANT_ID);
    setFlaggedFeedback((prev) => prev.filter((f) => f.feedback_id !== feedbackId));
  }, []);

  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder: Record<string, number> = { pending: 0, confirmed: 1, preparing: 2, ready: 3 };
    const sa = statusOrder[a.status] ?? 9, sb = statusOrder[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    return new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime();
  });

  const pendingRequests = sortRequests(
    serviceRequests.filter((r) => !['resolved', 'cancelled'].includes(r.status))
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-dot-bounce-0" />
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-dot-bounce-1" />
          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-dot-bounce-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gray-900 text-white shadow-lg border-b border-gray-800">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
              <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight">Kitchen Display</h1>
              <p className="text-[11px] text-gray-400 font-medium -mt-0.5">The Lahore Karahi</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Order count */}
            <div className="text-right">
              <p className="text-2xl font-bold font-display leading-none">{orders.length}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Orders</p>
            </div>

            {/* Waiter requests count */}
            {pendingRequests.length > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold font-display leading-none text-violet-400">
                  {pendingRequests.length}
                </p>
                <p className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-wider">Requests</p>
              </div>
            )}

            {/* Flagged feedback alerts count */}
            {flaggedFeedback.length > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold font-display leading-none text-red-400">
                  {flaggedFeedback.length}
                </p>
                <p className="text-[10px] text-red-400/70 font-semibold uppercase tracking-wider">Alerts</p>
              </div>
            )}

            {/* Connection status */}
            <div className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${connected
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]'
                : 'bg-red-400'}`}
              />
              <span className="text-xs font-medium text-gray-400">{connected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6">

        {/* ── Flagged Feedback Alerts Panel ───────────────────────────── */}
        {flaggedFeedback.length > 0 && (
          <section aria-label="Flagged Feedback">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold font-display text-gray-300 uppercase tracking-wider">
                Flagged Reviews
              </h2>
              <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                {flaggedFeedback.length} alert{flaggedFeedback.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {flaggedFeedback.map((fb) => (
                <FlaggedFeedbackAlert
                  key={fb.feedback_id}
                  feedback={fb}
                  onDismiss={handleDismissFeedback}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Waiter Requests Panel ─────────────────────────────────────── */}
        {(serviceRequests.length > 0 || pendingRequests.length > 0) && (
          <section aria-label="Waiter Requests">
            <div className="flex items-center gap-3 mb-3">
              {/* Section icon */}
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-violet-400">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h2 className="text-sm font-bold font-display text-gray-300 uppercase tracking-wider">
                Waiter Requests
              </h2>
              {pendingRequests.length > 0 && (
                <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {pendingRequests.length} pending
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {pendingRequests.map((req) => (
                <WaiterRequestCard
                  key={req.id}
                  request={req}
                  onResolved={handleRequestResolved}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Food Orders Grid ──────────────────────────────────────────── */}
        <section aria-label="Active Orders">
          {pendingRequests.length > 0 && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-orange-400">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold font-display text-gray-300 uppercase tracking-wider">Active Orders</h2>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-dot-bounce-0" />
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-dot-bounce-1" />
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-dot-bounce-2" />
              </div>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-600">
              <svg className="h-14 w-14 mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-base font-semibold font-display text-gray-500">All caught up</p>
              <p className="text-sm mt-1 text-gray-600">No active orders right now</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {sortedOrders.map((order) => (
                <KDSOrderTicket key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
