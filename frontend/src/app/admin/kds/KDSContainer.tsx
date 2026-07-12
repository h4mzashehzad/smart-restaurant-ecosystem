'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { socketClient } from '@/lib/socket';
import KDSOrderTicket from '@/components/kds/KDSOrderTicket';
import WaiterRequestCard, { WaiterRequest } from '@/components/kds/WaiterRequestCard';
import FlaggedFeedbackAlert, { type FlaggedFeedback } from '@/components/kds/FlaggedFeedbackAlert';
import ReservationCard, { type Reservation } from '@/components/kds/ReservationCard';
import QueueEntryCard, { type QueueEntry } from '@/components/kds/QueueEntryCard';
import CashPaymentCard, { type CashPayment } from '@/components/kds/CashPaymentCard';

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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [confirmingCashId, setConfirmingCashId] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const restaurantId = user?.restaurant_id ?? null;

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  // Fetch initial orders from REST API
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await api.getActiveKitchenOrders(restaurantId);
      if (mountedRef.current) setOrders(data ?? []);
    } catch (err) {
      console.error('Failed to fetch active orders:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [restaurantId]);

  // Socket setup
  useEffect(() => {
    if (authLoading || !user || !restaurantId) return;

    mountedRef.current = true;
    fetchOrders();

    socketClient.connect();
    socketClient.joinKitchen(restaurantId);

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

    socketClient.onOrderCreated((data: { order?: KDSOrder & { restaurant_id?: number } } | (KDSOrder & { restaurant_id?: number })) => {
      if (!mountedRef.current) return;
      const order = 'order' in data && data.order ? data.order : (data as KDSOrder & { restaurant_id?: number });
      if (order.restaurant_id !== restaurantId) return;
      setOrders((prev) => prev.some((o) => o.id === order.id) ? prev : [order, ...prev]);
    });

    socketClient.onOrderStatusChanged((data: { order_id: number; status: string }) => {
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

    socketClient.onWaiterRequestUpdated((data: {
      requestId: number;
      status: WaiterRequest['status'];
      acknowledgedAt?: string | null;
      resolvedAt?: string | null;
    }) => {
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

    // ── Reservations ─────────────────────────────────────────────────

    socketClient.onKitchenInitialReservations((initial: Reservation[]) => {
      if (mountedRef.current) setReservations(initial ?? []);
    });

    socketClient.onReservationUpdated((data: { reservation: Reservation; action: string }) => {
      if (!mountedRef.current) return;
      const { reservation, action } = data;
      if (action === 'created') {
        setReservations((prev) => prev.some((r) => r.id === reservation.id) ? prev : [reservation, ...prev]);
      } else {
        setReservations((prev) => prev.map((r) => r.id === reservation.id ? reservation : r));
      }
    });

    // ── Walk-in queue ──────────────────────────────────────────────

    socketClient.onKitchenInitialQueue((initial: QueueEntry[]) => {
      if (mountedRef.current) setQueueEntries(initial ?? []);
    });

    socketClient.onQueueUpdated((data: { entry: QueueEntry; action: string }) => {
      if (!mountedRef.current) return;
      const { entry, action } = data;
      if (action === 'joined') {
        setQueueEntries((prev) => prev.some((e) => e.id === entry.id) ? prev : [...prev, entry]);
      } else {
        setQueueEntries((prev) => prev.map((e) => e.id === entry.id ? entry : e));
      }
    });

    // ── Cash payments ────────────────────────────────────────────────
    socketClient.onKitchenInitialCashPayments((initial: CashPayment[]) => {
      if (mountedRef.current) setCashPayments(initial ?? []);
    });

    socketClient.onCashPaymentPending((payment: CashPayment) => {
      if (!mountedRef.current) return;
      setCashPayments((prev) => (prev.some((p) => p.id === payment.id) ? prev : [payment, ...prev]));
    });

    socketClient.onCashPaymentCompleted((data: { payment_id: number }) => {
      if (!mountedRef.current) return;
      setCashPayments((prev) => prev.filter((p) => p.id !== data.payment_id));
    });

    // Bootstrap from API as well
    interface RawCashPayment {
      id: number;
      amount: number | string;
      status: CashPayment['status'];
      payment_method: string;
      created_at: string;
      order?: {
        id: number;
        order_number: string;
        table_id?: number;
        table?: { table_number?: string };
        items?: Array<{ menu_item?: { name?: string }; quantity: number }>;
      } | null;
    }

    api.getPendingCashPayments(restaurantId)
      .then((data: RawCashPayment[]) => {
        if (!mountedRef.current) return;
        const mapped: CashPayment[] = (data ?? []).map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          status: p.status,
          payment_method: p.payment_method,
          created_at: p.created_at,
          order: p.order
            ? {
                id: p.order.id,
                order_number: p.order.order_number,
                table_number: p.order.table?.table_number,
                table_id: p.order.table_id,
                items_summary: (p.order.items ?? []).map((i) => ({
                  name: i.menu_item?.name,
                  quantity: i.quantity,
                })),
              }
            : null,
        }));
        setCashPayments(mapped);
      })
      .catch(() => {});

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
      socketClient.offKitchenInitialReservations();
      socketClient.offReservationUpdated();
      socketClient.offKitchenInitialQueue();
      socketClient.offQueueUpdated();
      socketClient.offKitchenInitialCashPayments();
      socketClient.offCashPaymentPending();
      socketClient.offCashPaymentCompleted();
      socketClient.leaveKitchen();
    };
  }, [authLoading, user, restaurantId, fetchOrders]);

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
    if (!restaurantId) return;
    socketClient.dismissFeedbackFlag(feedbackId, restaurantId);
    setFlaggedFeedback((prev) => prev.filter((f) => f.feedback_id !== feedbackId));
  }, [restaurantId]);

  const handleReservationStatus = useCallback((reservationId: number, status: string) => {
    socketClient.updateReservationStatus(reservationId, status);
    // Optimistic update
    setReservations((prev) => prev.map((r) =>
      r.id === reservationId ? { ...r, status: status as Reservation['status'] } : r
    ));
  }, []);

  const handleQueueStatus = useCallback((entryId: number, status: string) => {
    socketClient.updateQueueStatus(entryId, status);
    // Optimistic update
    setQueueEntries((prev) => prev.map((e) =>
      e.id === entryId ? { ...e, status: status as QueueEntry['status'] } : e
    ));
  }, []);

  const handleConfirmCash = useCallback(async (paymentId: number) => {
    setConfirmingCashId(paymentId);
    try {
      await api.confirmCashPayment(paymentId);
      setCashPayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (err) {
      console.error('Failed to confirm cash payment:', err);
    } finally {
      setConfirmingCashId(null);
    }
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

  const activeReservations = reservations.filter((r) => !['completed', 'cancelled', 'no_show'].includes(r.status));
  const activeQueue = queueEntries.filter((e) => ['waiting', 'called'].includes(e.status));

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
          <Link href="/admin" className="flex items-center gap-3">
            <div className="h-9 w-9 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center">
              <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight">Kitchen Display</h1>
              <p className="text-[11px] text-gray-400 font-medium -mt-0.5">
                {user?.restaurant?.name ?? 'Your Restaurant'}
              </p>
            </div>
          </Link>

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

            {/* Reservation count */}
            {activeReservations.length > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold font-display leading-none text-teal-400">
                  {activeReservations.length}
                </p>
                <p className="text-[10px] text-teal-400/70 font-semibold uppercase tracking-wider">Bookings</p>
              </div>
            )}

            {/* Queue count */}
            {activeQueue.length > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold font-display leading-none text-indigo-400">
                  {activeQueue.length}
                </p>
                <p className="text-[10px] text-indigo-400/70 font-semibold uppercase tracking-wider">Queue</p>
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

        {/* ── Cash Payments Panel ───────────────────────────────────────── */}
        {cashPayments.length > 0 && (
          <section aria-label="Cash Payments">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-amber-400">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold font-display text-gray-300 uppercase tracking-wider">
                Cash Payments
              </h2>
              <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {cashPayments.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {cashPayments.map((payment) => (
                <CashPaymentCard
                  key={payment.id}
                  payment={payment}
                  onConfirm={handleConfirmCash}
                  confirming={confirmingCashId === payment.id}
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

        {/* ── Reservations ─────────────────────────────────────────── */}
        {activeReservations.length > 0 && (
          <section aria-label="Reservations">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-teal-400">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h2 className="text-sm font-bold font-display text-gray-300 uppercase tracking-wider">Reservations</h2>
              <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {activeReservations.length} active
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeReservations.map((res) => (
                <ReservationCard key={res.id} reservation={res} onUpdateStatus={handleReservationStatus} />
              ))}
            </div>
          </section>
        )}

        {/* ── Walk-In Queue ───────────────────────────────────────── */}
        {activeQueue.length > 0 && (
          <section aria-label="Walk-In Queue">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                  className="w-3.5 h-3.5 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h2 className="text-sm font-bold font-display text-gray-300 uppercase tracking-wider">Walk-In Queue</h2>
              <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {activeQueue.length} waiting
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeQueue.map((entry) => (
                <QueueEntryCard key={entry.id} entry={entry} onUpdateStatus={handleQueueStatus} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
