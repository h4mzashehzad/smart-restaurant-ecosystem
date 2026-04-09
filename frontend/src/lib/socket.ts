import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;

  // Pending room memberships — re-joined automatically on reconnect
  private pendingSessionId: number | null = null;
  private pendingTable: { restaurantId: number; tableId: number } | null = null;
  private pendingKitchen: number | null = null;

  connect() {
    // Only create a new socket if none exists at all
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
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
      // Re-join all rooms on (re)connect
      this._rejoinRooms();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  private _rejoinRooms() {
    if (this.pendingSessionId !== null) {
      this.socket?.emit('session:join', this.pendingSessionId);
    }
    if (this.pendingTable) {
      this.socket?.emit('table:join', this.pendingTable);
    }
    if (this.pendingKitchen !== null) {
      this.socket?.emit('kitchen:join', this.pendingKitchen);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.pendingSessionId = null;
    this.pendingTable = null;
    this.pendingKitchen = null;
  }

  // Kitchen Display methods
  joinKitchen(restaurantId: number) {
    this.pendingKitchen = restaurantId;
    this.socket?.emit('kitchen:join', restaurantId);
  }

  onOrderCreated(callback: (order: any) => void) {
    this.socket?.on('order:created', callback);
  }

  onOrderStatusChanged(callback: (data: any) => void) {
    this.socket?.on('order:status:changed', callback);
  }

  updateOrderStatus(orderId: number, status: string) {
    this.socket?.emit('order:update:status', { orderId, status });
  }

  // Customer table methods
  joinTable(restaurantId: number, tableId: number) {
    this.pendingTable = { restaurantId, tableId };
    this.socket?.emit('table:join', { restaurantId, tableId });
  }

  onStatusChanged(callback: (data: any) => void) {
    this.socket?.on('status:changed', callback);
  }

  onKitchenInitialOrders(callback: (orders: any[]) => void) {
    this.socket?.on('kitchen:initial:orders', callback);
  }

  offOrderCreated(callback?: (order: any) => void) {
    this.socket?.off('order:created', callback);
  }

  offOrderStatusChanged(callback?: (data: any) => void) {
    this.socket?.off('order:status:changed', callback);
  }

  offKitchenInitialOrders(callback?: (orders: any[]) => void) {
    this.socket?.off('kitchen:initial:orders', callback);
  }

  // Session methods (live participant updates)
  joinSession(sessionId: number) {
    this.pendingSessionId = sessionId;
    this.socket?.emit('session:join', sessionId);
  }

  leaveSession(sessionId: number) {
    this.pendingSessionId = null;
    this.socket?.emit('session:leave', sessionId);
  }

  leaveTable(restaurantId: number, tableId: number) {
    this.pendingTable = null;
    this.socket?.emit('table:leave', { restaurantId, tableId });
  }

  onSessionStateChanged(callback: (data: any) => void) {
    this.socket?.on('session:state:changed', callback);
  }

  offSessionStateChanged(callback?: (data: any) => void) {
    this.socket?.off('session:state:changed', callback);
  }

  // Customer table order events
  onOrderConfirmed(callback: (data: any) => void) {
    this.socket?.on('order:confirmed', callback);
  }

  offOrderConfirmed(callback?: (data: any) => void) {
    this.socket?.off('order:confirmed', callback);
  }

  offStatusChanged(callback?: (data: any) => void) {
    this.socket?.off('status:changed', callback);
  }

  // Cart sync methods
  emitCartUpdate(sessionId: number, items: any[]) {
    this.socket?.emit('cart:sync', { sessionId, items });
  }

  onCartSync(callback: (data: { sessionId: number; items: any[] }) => void) {
    this.socket?.on('cart:sync', callback);
  }

  offCartSync(callback?: (data: any) => void) {
    this.socket?.off('cart:sync', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  onConnect(callback: () => void) {
    this.socket?.on('connect', callback);
  }

  offConnect(callback: () => void) {
    this.socket?.off('connect', callback);
  }

  onDisconnect(callback: () => void) {
    this.socket?.on('disconnect', callback);
  }

  offDisconnect(callback: () => void) {
    this.socket?.off('disconnect', callback);
  }
}

export const socketClient = new SocketClient();
