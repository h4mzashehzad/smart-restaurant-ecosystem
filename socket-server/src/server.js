const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Redis setup
const redis = new Redis(process.env.REDIS_URL);
const redisSubscriber = new Redis(process.env.REDIS_URL);

// Subscribe to Laravel broadcast channels
redisSubscriber.subscribe('laravel-database-order:created');
redisSubscriber.subscribe('laravel-database-order:status:updated');
// Pattern-subscribe for session channels (session IDs vary)
redisSubscriber.psubscribe('laravel-database-table-session.*');

// Handle Redis messages
redisSubscriber.on('message', async (channel, message) => {
  try {
    const envelope = JSON.parse(message);
    // Laravel Redis broadcaster wraps payload in { event, data, socket }
    const data = envelope.data || envelope;
    console.log(`Received message on ${channel}:`, data);

    if (channel === 'laravel-database-order:created') {
      const { order, restaurant_id } = data;

      // Cache order in Redis
      await redis.setex(
        `order:${order.id}:details`,
        7200,
        JSON.stringify(order)
      );

      // Add to pending orders set
      await redis.sadd(`order:pending:${restaurant_id}`, order.id);

      // Broadcast to kitchen display
      io.to(`kitchen:restaurant_${restaurant_id}`).emit('order:created', order);

      // Broadcast to customer table
      io.to(`table:restaurant_${restaurant_id}_table_${order.table_id}`).emit('order:confirmed', {
        orderId: order.id,
        orderNumber: order.order_number,
        estimatedTime: order.estimated_time
      });

      console.log(`Order ${order.id} broadcast to kitchen and table`);
    }

    if (channel === 'laravel-database-order:status:updated') {
      const { order_id, status, restaurant_id, table_id } = data;

      // Update cached order
      const cachedOrder = await redis.get(`order:${order_id}:details`);
      if (cachedOrder) {
        const order = JSON.parse(cachedOrder);
        order.status = status;
        await redis.setex(`order:${order_id}:details`, 7200, JSON.stringify(order));
      }

      // Remove from pending if completed
      if (['completed', 'cancelled'].includes(status)) {
        await redis.srem(`order:pending:${restaurant_id}`, order_id);
      }

      // Broadcast status update
      io.to(`kitchen:restaurant_${restaurant_id}`).emit('order:status:changed', {
        orderId: order_id,
        status
      });

      io.to(`table:restaurant_${restaurant_id}_table_${table_id}`).emit('status:changed', {
        orderId: order_id,
        status
      });

      console.log(`Order ${order_id} status updated to ${status}`);
    }
  } catch (error) {
    console.error('Error processing Redis message:', error);
  }
});

// Handle pattern-matched Redis messages (session channels)
redisSubscriber.on('pmessage', async (pattern, channel, message) => {
  try {
    const envelope = JSON.parse(message);
    const data = envelope.data || envelope;

    // Extract session ID from channel: laravel-database-table-session.{id}
    const match = channel.match(/laravel-database-table-session\.(\d+)/);
    if (match) {
      const sessionId = match[1];
      io.to(`session:${sessionId}`).emit('session:state:changed', data);
      console.log(`Session ${sessionId} state changed, broadcast to room`);
    }
  } catch (error) {
    console.error('Error processing session Redis message:', error);
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Kitchen display joins
  socket.on('kitchen:join', async (restaurantId) => {
    socket.join(`kitchen:restaurant_${restaurantId}`);
    console.log(`Socket ${socket.id} joined kitchen room for restaurant ${restaurantId}`);

    // Send active orders on connect
    try {
      const activeOrderIds = await redis.smembers(`order:pending:${restaurantId}`);
      const orders = await Promise.all(
        activeOrderIds.map(async (id) => {
          const orderData = await redis.get(`order:${id}:details`);
          return orderData ? JSON.parse(orderData) : null;
        })
      );

      const validOrders = orders.filter(o => o !== null);
      socket.emit('kitchen:initial:orders', validOrders);
      console.log(`Sent ${validOrders.length} active orders to ${socket.id}`);
    } catch (error) {
      console.error('Error sending initial orders:', error);
    }
  });

  // Customer table joins
  socket.on('table:join', ({ restaurantId, tableId }) => {
    const room = `table:restaurant_${restaurantId}_table_${tableId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined table room ${room}`);
  });

  // Customer session joins (for live participant updates)
  socket.on('session:join', (sessionId) => {
    const room = `session:${sessionId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined session room ${room}`);
  });

  // Customer session leave
  socket.on('session:leave', (sessionId) => {
    const room = `session:${sessionId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left session room ${room}`);
  });

  // Customer table leave
  socket.on('table:leave', ({ restaurantId, tableId }) => {
    const room = `table:restaurant_${restaurantId}_table_${tableId}`;
    socket.leave(room);
    console.log(`Socket ${socket.id} left table room ${room}`);
  });

  // Cart sync — relay to other devices in the same session
  socket.on('cart:sync', async ({ sessionId, items }) => {
    const room = `session:${sessionId}`;
    // Only relay if the sender is actually in the session room
    if (!socket.rooms.has(room)) {
      console.log(`Cart sync from ${socket.id} REJECTED — not in room ${room}`);
      return;
    }
    const sockets = await io.in(room).fetchSockets();
    const othersCount = sockets.filter(s => s.id !== socket.id).length;
    socket.to(room).emit('cart:sync', { sessionId, items });
    console.log(`Cart sync from ${socket.id} to session ${sessionId} (${items.length} items) → ${othersCount} other socket(s) in room`);
  });

  // Kitchen staff updates order status
  socket.on('order:update:status', async (data) => {
    const { orderId, status } = data;
    console.log(`Received status update for order ${orderId}: ${status}`);

    try {
      // Trigger Laravel webhook to update database
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${process.env.LARAVEL_API_URL}/api/webhooks/order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId, status })
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      console.log(`Order ${orderId} status updated via webhook`);
    } catch (error) {
      console.error('Error updating order status:', error);
      socket.emit('error', { message: 'Failed to update order status' });
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Error handler
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Redis URL: ${process.env.REDIS_URL}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    redis.disconnect();
    redisSubscriber.disconnect();
    console.log('Server closed');
    process.exit(0);
  });
});
