import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Kitchen Display methods
  joinKitchen(restaurantId: number) {
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
    this.socket?.emit('table:join', { restaurantId, tableId });
  }

  onStatusChanged(callback: (data: any) => void) {
    this.socket?.on('status:changed', callback);
  }

  offOrderCreated(callback?: (order: any) => void) {
    this.socket?.off('order:created', callback);
  }

  offOrderStatusChanged(callback?: (data: any) => void) {
    this.socket?.off('order:status:changed', callback);
  }
}

export const socketClient = new SocketClient();
