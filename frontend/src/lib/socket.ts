import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;

  // Pending room memberships — re-joined automatically on reconnect
  private pendingSessionId: number | null = null;
  private pendingTable: { restaurantId: number; tableId: number } | null = null;
  private pendingKitchen: number | null = null;
  /** Refcount so KDS + Queue can share one kitchen room without nuking each other. */
  private kitchenSubscribers = 0;

  connect() {
    if (this.socket) {
      if (!this.socket.connected) this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this._rejoinRooms();
    });

    this.socket.on('disconnect', () => console.log('Socket disconnected'));
    this.socket.on('error', (error) => console.error('Socket error:', error));

    return this.socket;
  }

  private _rejoinRooms() {
    if (this.pendingSessionId !== null) this.socket?.emit('session:join', this.pendingSessionId);
    if (this.pendingTable) this.socket?.emit('table:join', this.pendingTable);
    if (this.pendingKitchen !== null && this.kitchenSubscribers > 0) {
      this.socket?.emit('kitchen:join', { restaurantId: this.pendingKitchen, token: localStorage.getItem('auth_token') });
    }
  }

  disconnect() {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
    this.pendingSessionId = null;
    this.pendingTable = null;
    this.pendingKitchen = null;
    this.kitchenSubscribers = 0;
  }

  // ── Kitchen Display ─────────────────────────────────────────────────────
  joinKitchen(restaurantId: number) {
    this.kitchenSubscribers += 1;
    this.pendingKitchen = restaurantId;
    this.socket?.emit('kitchen:join', { restaurantId, token: localStorage.getItem('auth_token') });
  }

  /** Leave kitchen room without tearing down the shared socket unless unused. */
  leaveKitchen() {
    this.kitchenSubscribers = Math.max(0, this.kitchenSubscribers - 1);
    if (this.kitchenSubscribers === 0) {
      this.pendingKitchen = null;
    }
  }

  onOrderCreated(callback: (order: any) => void) {
    this.socket?.on('order:created', callback);
  }
  offOrderCreated(callback?: (order: any) => void) {
    this.socket?.off('order:created', callback);
  }

  onOrderStatusChanged(callback: (data: any) => void) {
    this.socket?.on('order:status:changed', callback);
  }
  offOrderStatusChanged(callback?: (data: any) => void) {
    this.socket?.off('order:status:changed', callback);
  }

  updateOrderStatus(orderId: number, status: string) {
    this.socket?.emit('order:update:status', { orderId, status });
  }

  onKitchenInitialOrders(callback: (orders: any[]) => void) {
    this.socket?.on('kitchen:initial:orders', callback);
  }
  offKitchenInitialOrders(callback?: (orders: any[]) => void) {
    this.socket?.off('kitchen:initial:orders', callback);
  }

  // ── Waiter Requests — Kitchen side ─────────────────────────────────────
  onKitchenInitialServiceRequests(callback: (requests: any[]) => void) {
    this.socket?.on('kitchen:initial:service-requests', callback);
  }
  offKitchenInitialServiceRequests(callback?: (requests: any[]) => void) {
    this.socket?.off('kitchen:initial:service-requests', callback);
  }

  onWaiterRequestNew(callback: (request: any) => void) {
    this.socket?.on('waiter:request:new', callback);
  }
  offWaiterRequestNew(callback?: (request: any) => void) {
    this.socket?.off('waiter:request:new', callback);
  }

  onWaiterRequestUpdated(callback: (data: any) => void) {
    this.socket?.on('waiter:request:updated', callback);
  }
  offWaiterRequestUpdated(callback?: (data: any) => void) {
    this.socket?.off('waiter:request:updated', callback);
  }

  acknowledgeWaiterRequest(requestId: number) {
    this.socket?.emit('waiter:request:acknowledge', { requestId });
  }

  resolveWaiterRequest(requestId: number) {
    this.socket?.emit('waiter:request:resolve', { requestId });
  }

  // ── Waiter Requests — Customer session side ─────────────────────────────
  onWaiterRequestConfirmed(callback: (data: any) => void) {
    this.socket?.on('waiter:request:confirmed', callback);
  }
  offWaiterRequestConfirmed(callback?: (data: any) => void) {
    this.socket?.off('waiter:request:confirmed', callback);
  }

  // ── Customer table ──────────────────────────────────────────────────────
  joinTable(restaurantId: number, tableId: number) {
    this.pendingTable = { restaurantId, tableId };
    this.socket?.emit('table:join', { restaurantId, tableId });
  }

  leaveTable(restaurantId: number, tableId: number) {
    this.pendingTable = null;
    this.socket?.emit('table:leave', { restaurantId, tableId });
  }

  onStatusChanged(callback: (data: any) => void) {
    this.socket?.on('status:changed', callback);
  }
  offStatusChanged(callback?: (data: any) => void) {
    this.socket?.off('status:changed', callback);
  }

  onOrderConfirmed(callback: (data: any) => void) {
    this.socket?.on('order:confirmed', callback);
  }
  offOrderConfirmed(callback?: (data: any) => void) {
    this.socket?.off('order:confirmed', callback);
  }

  // ── Customer session ────────────────────────────────────────────────────
  joinSession(sessionId: number) {
    this.pendingSessionId = sessionId;
    this.socket?.emit('session:join', sessionId);
  }

  leaveSession(sessionId: number) {
    this.pendingSessionId = null;
    this.socket?.emit('session:leave', sessionId);
  }

  onSessionStateChanged(callback: (data: any) => void) {
    this.socket?.on('session:state:changed', callback);
  }
  offSessionStateChanged(callback?: (data: any) => void) {
    this.socket?.off('session:state:changed', callback);
  }

  // ── Cart sync ───────────────────────────────────────────────────────────
  emitCartUpdate(sessionId: number, items: any[]) {
    this.socket?.emit('cart:sync', { sessionId, items });
  }

  onCartSync(callback: (data: { sessionId: number; items: any[] }) => void) {
    this.socket?.on('cart:sync', callback);
  }
  offCartSync(callback?: (data: any) => void) {
    this.socket?.off('cart:sync', callback);
  }

  // ── Feedback flagging — Kitchen side ───────────────────────────────────
  onFeedbackFlagged(callback: (data: any) => void) {
    this.socket?.on('feedback:flagged', callback);
  }
  offFeedbackFlagged(callback?: (data: any) => void) {
    this.socket?.off('feedback:flagged', callback);
  }

  onKitchenInitialFlaggedFeedback(callback: (data: any[]) => void) {
    this.socket?.on('kitchen:initial:flagged-feedback', callback);
  }
  offKitchenInitialFlaggedFeedback(callback?: (data: any[]) => void) {
    this.socket?.off('kitchen:initial:flagged-feedback', callback);
  }

  dismissFeedbackFlag(feedbackId: number, restaurantId: number) {
    this.socket?.emit('feedback:flag:dismiss', { feedbackId, restaurantId });
  }

  onFeedbackFlagDismissed(callback: (data: any) => void) {
    this.socket?.on('feedback:flag:dismissed', callback);
  }
  offFeedbackFlagDismissed(callback?: (data: any) => void) {
    this.socket?.off('feedback:flag:dismissed', callback);
  }

  // ── Reservations — Kitchen side ─────────────────────────────────────────
  onKitchenInitialReservations(callback: (data: any[]) => void) {
    this.socket?.on('kitchen:initial:reservations', callback);
  }
  offKitchenInitialReservations(callback?: (data: any[]) => void) {
    this.socket?.off('kitchen:initial:reservations', callback);
  }

  onReservationUpdated(callback: (data: any) => void) {
    this.socket?.on('reservation:updated', callback);
  }
  offReservationUpdated(callback?: (data: any) => void) {
    this.socket?.off('reservation:updated', callback);
  }

  updateReservationStatus(reservationId: number, status: string) {
    this.socket?.emit('reservation:status:update', { reservationId, status });
  }

  // ── Queue — Kitchen side ──────────────────────────────────────────────
  onKitchenInitialQueue(callback: (data: any[]) => void) {
    this.socket?.on('kitchen:initial:queue', callback);
  }
  offKitchenInitialQueue(callback?: (data: any[]) => void) {
    this.socket?.off('kitchen:initial:queue', callback);
  }

  onQueueUpdated(callback: (data: any) => void) {
    this.socket?.on('queue:updated', callback);
  }
  offQueueUpdated(callback?: (data: any) => void) {
    this.socket?.off('queue:updated', callback);
  }

  updateQueueStatus(entryId: number, status: string) {
    this.socket?.emit('queue:status:update', { entryId, status });
  }

  // ── Payments ────────────────────────────────────────────────────────────
  onPaymentCompleted(callback: (data: any) => void) {
    this.socket?.on('payment:completed', callback);
  }
  offPaymentCompleted(callback?: (data: any) => void) {
    this.socket?.off('payment:completed', callback);
  }

  onPaymentFailed(callback: (data: any) => void) {
    this.socket?.on('payment:failed', callback);
  }
  offPaymentFailed(callback?: (data: any) => void) {
    this.socket?.off('payment:failed', callback);
  }

  onCheckoutStarted(callback: (data: any) => void) {
    this.socket?.on('checkout:started', callback);
  }
  offCheckoutStarted(callback?: (data: any) => void) {
    this.socket?.off('checkout:started', callback);
  }

  onSplitBillConfigured(callback: (data: any) => void) {
    this.socket?.on('split-bill:configured', callback);
  }
  offSplitBillConfigured(callback?: (data: any) => void) {
    this.socket?.off('split-bill:configured', callback);
  }

  onSplitBillItemClaimed(callback: (data: any) => void) {
    this.socket?.on('split-bill:item-claimed', callback);
  }
  offSplitBillItemClaimed(callback?: (data: any) => void) {
    this.socket?.off('split-bill:item-claimed', callback);
  }

  onSplitBillUnlocked(callback: (data: any) => void) {
    this.socket?.on('split-bill:unlocked', callback);
  }
  offSplitBillUnlocked(callback?: (data: any) => void) {
    this.socket?.off('split-bill:unlocked', callback);
  }

  onAllPaymentsCompleted(callback: (data: any) => void) {
    this.socket?.on('all-payments:completed', callback);
  }
  offAllPaymentsCompleted(callback?: (data: any) => void) {
    this.socket?.off('all-payments:completed', callback);
  }

  onCashPaymentPending(callback: (data: any) => void) {
    this.socket?.on('cash-payment:pending', callback);
  }
  offCashPaymentPending(callback?: (data: any) => void) {
    this.socket?.off('cash-payment:pending', callback);
  }

  onCashPaymentCompleted(callback: (data: any) => void) {
    this.socket?.on('cash-payment:completed', callback);
  }
  offCashPaymentCompleted(callback?: (data: any) => void) {
    this.socket?.off('cash-payment:completed', callback);
  }

  onKitchenInitialCashPayments(callback: (data: any[]) => void) {
    this.socket?.on('kitchen:initial:cash-payments', callback);
  }
  offKitchenInitialCashPayments(callback?: (data: any[]) => void) {
    this.socket?.off('kitchen:initial:cash-payments', callback);
  }

  // ── Utilities ───────────────────────────────────────────────────────────
  isConnected(): boolean { return this.socket?.connected ?? false; }

  onConnect(callback: () => void)    { this.socket?.on('connect', callback); }
  offConnect(callback: () => void)   { this.socket?.off('connect', callback); }
  onDisconnect(callback: () => void) { this.socket?.on('disconnect', callback); }
  offDisconnect(callback: () => void){ this.socket?.off('disconnect', callback); }
}

export const socketClient = new SocketClient();
