const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Trust the reverse proxy (Coolify/Traefik) so req.ip is correct
app.set('trust proxy', 1);

// CORS — FRONTEND_URL may be a comma-separated list for multi-origin support
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true
}));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Redis setup
const redis = new Redis(process.env.REDIS_URL);
const redisSubscriber = new Redis(process.env.REDIS_URL);

// Redis channel prefix — must match Laravel's REDIS_PREFIX.
// Laravel default: Str::slug(APP_NAME) . '-database-'
// For APP_NAME="Smart Restaurant" → "smart-restaurant-database-"
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'smart-restaurant-database-';

// ── Redis subscriptions ──────────────────────────────────────────────────────
// Order channels (exact-match)
redisSubscriber.subscribe(`${REDIS_PREFIX}order:created`);
redisSubscriber.subscribe(`${REDIS_PREFIX}order:status:updated`);
// Feedback flagging channel
redisSubscriber.subscribe(`${REDIS_PREFIX}feedback:flagged`);
// Reservation & queue channels
redisSubscriber.subscribe(`${REDIS_PREFIX}reservation:updated`);
redisSubscriber.subscribe(`${REDIS_PREFIX}queue:updated`);
// Pattern subscriptions (variable segment)
redisSubscriber.psubscribe(`${REDIS_PREFIX}table-session.*`);
redisSubscriber.psubscribe(`${REDIS_PREFIX}service-requests.*`);
// Payment channels (broadcast to session rooms and kitchen)
redisSubscriber.subscribe(`${REDIS_PREFIX}payment:completed`);
redisSubscriber.subscribe(`${REDIS_PREFIX}split-bill:configured`);
redisSubscriber.subscribe(`${REDIS_PREFIX}all-payments:completed`);
redisSubscriber.subscribe(`${REDIS_PREFIX}payment:failed`);
redisSubscriber.subscribe(`${REDIS_PREFIX}cash-payment:pending`);

// ── Exact-match Redis messages ───────────────────────────────────────────────
redisSubscriber.on('message', async (channel, message) => {
  try {
    const envelope = JSON.parse(message);
    const data = envelope.data || envelope;
    console.log(`[Redis] message on ${channel}:`, data);

    if (channel === `${REDIS_PREFIX}order:created`) {
      const { order, restaurant_id } = data;

      await redis.setex(`order:${order.id}:details`, 7200, JSON.stringify(order));
      await redis.sadd(`order:pending:${restaurant_id}`, order.id);

      io.to(`kitchen:restaurant_${restaurant_id}`).emit('order:created', order);
      io.to(`table:restaurant_${restaurant_id}_table_${order.table_id}`).emit('order:confirmed', {
        orderId: order.id,
        orderNumber: order.order_number,
        estimatedTime: order.estimated_time
      });
      console.log(`[Orders] Order ${order.id} broadcast to kitchen and table`);
    }

    if (channel === `${REDIS_PREFIX}order:status:updated`) {
      const { order_id, status, restaurant_id, table_id } = data;

      const cachedOrder = await redis.get(`order:${order_id}:details`);
      if (cachedOrder) {
        const order = JSON.parse(cachedOrder);
        order.status = status;
        await redis.setex(`order:${order_id}:details`, 7200, JSON.stringify(order));
      }

      if (['completed', 'cancelled'].includes(status)) {
        await redis.srem(`order:pending:${restaurant_id}`, order_id);
      }

      io.to(`kitchen:restaurant_${restaurant_id}`).emit('order:status:changed', { orderId: order_id, status });
      io.to(`table:restaurant_${restaurant_id}_table_${table_id}`).emit('status:changed', { orderId: order_id, status });
      console.log(`[Orders] Order ${order_id} status updated to ${status}`);
    }

    // ── Flagged feedback alert ─────────────────────────────────────────
    if (channel === `${REDIS_PREFIX}feedback:flagged`) {
      const feedback = data;
      const restaurantId = feedback.restaurant_id;

      // Cache with 15-minute TTL (900 seconds) for auto-expiry
      await redis.setex(
        `feedback:flagged:${feedback.feedback_id}:details`,
        900,
        JSON.stringify(feedback)
      );
      await redis.sadd(`feedback:flagged:${restaurantId}`, String(feedback.feedback_id));

      // Broadcast to kitchen
      io.to(`kitchen:restaurant_${restaurantId}`).emit('feedback:flagged', feedback);
      console.log(`[Feedback] Flagged feedback ${feedback.feedback_id} → kitchen:restaurant_${restaurantId}`);
    }

    // ── Reservation updated ────────────────────────────────────────────
    if (channel === `${REDIS_PREFIX}reservation:updated`) {
      const { reservation, restaurant_id, action } = data;

      // Cache reservation (24h TTL)
      await redis.setex(
        `reservation:${reservation.id}:details`,
        86400,
        JSON.stringify(reservation)
      );

      // Maintain today's reservation set
      const today = new Date().toISOString().split('T')[0];
      if (reservation.reservation_date && reservation.reservation_date.startsWith(today)) {
        if (['cancelled', 'completed', 'no_show'].includes(reservation.status)) {
          await redis.srem(`reservations:today:${restaurant_id}`, String(reservation.id));
        } else {
          await redis.sadd(`reservations:today:${restaurant_id}`, String(reservation.id));
        }
      }

      io.to(`kitchen:restaurant_${restaurant_id}`).emit('reservation:updated', { reservation, action });
      console.log(`[Reservation] ${action} reservation ${reservation.id} → kitchen:restaurant_${restaurant_id}`);
    }

    // ── Queue updated ─────────────────────────────────────────────────
    if (channel === `${REDIS_PREFIX}queue:updated`) {
      const { entry, restaurant_id, action } = data;

      // Cache queue entry (4h TTL)
      await redis.setex(
        `queue:${entry.id}:details`,
        14400,
        JSON.stringify(entry)
      );

      // Maintain active queue set
      if (['seated', 'cancelled', 'no_show'].includes(entry.status)) {
        await redis.srem(`queue:active:${restaurant_id}`, String(entry.id));
      } else {
        await redis.sadd(`queue:active:${restaurant_id}`, String(entry.id));
      }

      io.to(`kitchen:restaurant_${restaurant_id}`).emit('queue:updated', { entry, action });
      console.log(`[Queue] ${action} entry ${entry.id} → kitchen:restaurant_${restaurant_id}`);
    }
    // ── Payment: individual participant completed ──────────────────────
    if (channel === `${REDIS_PREFIX}payment:completed`) {
      const { session_id, payment_id, participant_id, amount, payment_method, split_group_id, receipt_url } = data;
      io.to(`session:${session_id}`).emit('payment:completed', {
        paymentId:      payment_id,
        participantId:  participant_id,
        amount,
        paymentMethod:  payment_method,
        splitGroupId:   split_group_id,
        receiptUrl:     receipt_url,
      });
      console.log(`[Payment] payment:completed for session ${session_id}, participant ${participant_id}`);
    }

    // ── Split-bill configured by host ──────────────────────────────────
    if (channel === `${REDIS_PREFIX}split-bill:configured`) {
      const { session_id, split_type, split_group_id, participants, total_amount } = data;
      io.to(`session:${session_id}`).emit('split-bill:configured', {
        sessionId:    session_id,
        splitType:    split_type,
        splitGroupId: split_group_id,
        participants,
        totalAmount:  total_amount,
      });
      console.log(`[Payment] split-bill:configured for session ${session_id}, group ${split_group_id}`);
    }

    // ── All payments in split group completed ──────────────────────────
    if (channel === `${REDIS_PREFIX}all-payments:completed`) {
      const { session_id, order_id, total_amount, split_group_id, receipt_urls } = data;
      io.to(`session:${session_id}`).emit('all-payments:completed', {
        sessionId:    session_id,
        orderId:      order_id,
        totalAmount:  total_amount,
        splitGroupId: split_group_id,
        receiptUrls:  receipt_urls,
      });
      console.log(`[Payment] all-payments:completed for session ${session_id}, order ${order_id}`);
    }

    // ── Payment failed / split group rollback ──────────────────────────
    if (channel === `${REDIS_PREFIX}payment:failed`) {
      const { session_id, split_group_id, failed_participant_id, reason, rollback_initiated } = data;
      io.to(`session:${session_id}`).emit('payment:failed', {
        sessionId:          session_id,
        splitGroupId:       split_group_id,
        failedParticipantId:failed_participant_id,
        reason,
        rollbackInitiated:  rollback_initiated,
      });
      console.log(`[Payment] payment:failed for session ${session_id}, reason: ${reason}`);
    }

    // ── Cash payment pending — relay to KDS kitchen room ──────────────
    if (channel === `${REDIS_PREFIX}cash-payment:pending`) {
      const { payment_id, session_id, restaurant_id, participant_id, amount, table_number, split_group_id, payment_type } = data;

      // Cache pending cash payment for KDS initial load
      const cacheKey = `cash-payment:pending:${payment_id}`;
      await redis.setex(cacheKey, 3600, JSON.stringify(data)); // 1h TTL
      await redis.sadd(`cash-payments:pending:${restaurant_id}`, String(payment_id));

      io.to(`kitchen:restaurant_${restaurant_id}`).emit('cash:payment:pending', {
        paymentId:    payment_id,
        sessionId:    session_id,
        participantId:participant_id,
        amount,
        tableNumber:  table_number,
        splitGroupId: split_group_id,
        paymentType:  payment_type,
      });
      console.log(`[Payment] cash:payment:pending → kitchen:restaurant_${restaurant_id}, table ${table_number}, Rs ${amount}`);
    }

  } catch (error) {
    console.error('[Redis] Error processing message:', error);
  }
});

// ── Pattern-matched Redis messages ───────────────────────────────────────────
redisSubscriber.on('pmessage', async (pattern, channel, message) => {
  try {
    const envelope = JSON.parse(message);
    const data = envelope.data || envelope;
    const eventName = envelope.event || '';

    // ── Table session changes (participants join/leave) ──
    const sessionMatch = channel.match(new RegExp(`${REDIS_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}table-session\\.(\\d+)`));
    if (sessionMatch) {
      const sessionId = sessionMatch[1];
      io.to(`session:${sessionId}`).emit('session:state:changed', data);
      console.log(`[Session] Session ${sessionId} state changed`);
      return;
    }

    // ── Service / waiter requests ──
    const srMatch = channel.match(new RegExp(`${REDIS_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}service-requests\\.restaurant_(\\d+)`));
    if (srMatch) {
      const restaurantId = srMatch[1];

      // ServiceRequestCreated
      if (eventName.includes('ServiceRequestCreated') || data.service_request) {
        const { service_request, session_id } = data;

        // Cache the pending request in Redis
        await redis.setex(
          `service-request:${service_request.id}:details`,
          3600,
          JSON.stringify(service_request)
        );
        await redis.sadd(`service-requests:pending:${restaurantId}`, service_request.id);

        // Notify the KDS kitchen room
        io.to(`kitchen:restaurant_${restaurantId}`).emit('waiter:request:new', service_request);

        // Confirm to the customer's session room
        if (session_id) {
          io.to(`session:${session_id}`).emit('waiter:request:confirmed', {
            requestId:   service_request.id,
            requestType: service_request.request_type,
            status:      'pending',
          });
        }
        console.log(`[Waiter] Request ${service_request.id} → kitchen:restaurant_${restaurantId}`);
      }

      // ServiceRequestUpdated
      if (eventName.includes('ServiceRequestUpdated') || data.request_id) {
        const { request_id, status, session_id, acknowledged_at, resolved_at } = data;

        // Update Redis cache
        const cached = await redis.get(`service-request:${request_id}:details`);
        if (cached) {
          const sr = JSON.parse(cached);
          sr.status = status;
          if (acknowledged_at) sr.acknowledged_at = acknowledged_at;
          if (resolved_at)     sr.resolved_at     = resolved_at;
          await redis.setex(`service-request:${request_id}:details`, 3600, JSON.stringify(sr));
        }

        // Remove from pending set when resolved/cancelled
        if (['resolved', 'cancelled'].includes(status)) {
          await redis.srem(`service-requests:pending:${restaurantId}`, request_id);
        }

        const updatePayload = { requestId: request_id, status, acknowledgedAt: acknowledged_at, resolvedAt: resolved_at };

        // Update KDS
        io.to(`kitchen:restaurant_${restaurantId}`).emit('waiter:request:updated', updatePayload);

        // Update customer session
        if (session_id) {
          io.to(`session:${session_id}`).emit('waiter:request:updated', updatePayload);
        }
        console.log(`[Waiter] Request ${request_id} status → ${status}`);
      }
    }
  } catch (error) {
    console.error('[Redis] Error processing pattern message:', error);
  }
});

// ── Socket.io connection handling ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // ── Kitchen Display joins ─────────────────────────────────────────────────
  socket.on('kitchen:join', async (restaurantId) => {
    socket.join(`kitchen:restaurant_${restaurantId}`);
    console.log(`[Kitchen] Socket ${socket.id} joined kitchen room for restaurant ${restaurantId}`);

    // Send active orders from Redis cache
    try {
      const activeOrderIds = await redis.smembers(`order:pending:${restaurantId}`);
      const orders = await Promise.all(
        activeOrderIds.map(async (id) => {
          const d = await redis.get(`order:${id}:details`);
          return d ? JSON.parse(d) : null;
        })
      );
      socket.emit('kitchen:initial:orders', orders.filter(Boolean));
      console.log(`[Kitchen] Sent ${orders.filter(Boolean).length} active orders to ${socket.id}`);
    } catch (error) {
      console.error('[Kitchen] Error sending initial orders:', error);
    }

    // Send active service requests from Redis cache
    try {
      const pendingRequestIds = await redis.smembers(`service-requests:pending:${restaurantId}`);
      const serviceRequests = await Promise.all(
        pendingRequestIds.map(async (id) => {
          const d = await redis.get(`service-request:${id}:details`);
          return d ? JSON.parse(d) : null;
        })
      );
      socket.emit('kitchen:initial:service-requests', serviceRequests.filter(Boolean));
      console.log(`[Kitchen] Sent ${serviceRequests.filter(Boolean).length} pending service requests to ${socket.id}`);
    } catch (error) {
      console.error('[Kitchen] Error sending initial service requests:', error);
    }

    // Send flagged feedback from Redis cache (stale entries auto-expire via 15min TTL)
    try {
      const flaggedIds = await redis.smembers(`feedback:flagged:${restaurantId}`);
      const flaggedFeedback = [];
      const staleIds = [];

      for (const id of flaggedIds) {
        const d = await redis.get(`feedback:flagged:${id}:details`);
        if (d) {
          flaggedFeedback.push(JSON.parse(d));
        } else {
          staleIds.push(id); // TTL expired, clean up set
        }
      }

      // Remove expired IDs from the set
      if (staleIds.length > 0) {
        await redis.srem(`feedback:flagged:${restaurantId}`, ...staleIds);
      }

      socket.emit('kitchen:initial:flagged-feedback', flaggedFeedback);
      console.log(`[Kitchen] Sent ${flaggedFeedback.length} flagged feedback alerts to ${socket.id}`);
    } catch (error) {
      console.error('[Kitchen] Error sending flagged feedback:', error);
    }

    // Send today's reservations from Redis cache
    try {
      const reservationIds = await redis.smembers(`reservations:today:${restaurantId}`);
      const reservations = [];
      const staleResIds = [];

      for (const id of reservationIds) {
        const d = await redis.get(`reservation:${id}:details`);
        if (d) {
          reservations.push(JSON.parse(d));
        } else {
          staleResIds.push(id);
        }
      }

      if (staleResIds.length > 0) {
        await redis.srem(`reservations:today:${restaurantId}`, ...staleResIds);
      }

      socket.emit('kitchen:initial:reservations', reservations);
      console.log(`[Kitchen] Sent ${reservations.length} reservations to ${socket.id}`);
    } catch (error) {
      console.error('[Kitchen] Error sending reservations:', error);
    }

    // Send active queue entries from Redis cache
    try {
      const queueIds = await redis.smembers(`queue:active:${restaurantId}`);
      const queueEntries = [];
      const staleQueueIds = [];

      for (const id of queueIds) {
        const d = await redis.get(`queue:${id}:details`);
        if (d) {
          queueEntries.push(JSON.parse(d));
        } else {
          staleQueueIds.push(id);
        }
      }

      if (staleQueueIds.length > 0) {
        await redis.srem(`queue:active:${restaurantId}`, ...staleQueueIds);
      }

      socket.emit('kitchen:initial:queue', queueEntries);
      console.log(`[Kitchen] Sent ${queueEntries.length} queue entries to ${socket.id}`);
    } catch (error) {
      console.error('[Kitchen] Error sending queue entries:', error);
    }
    // Send active cash payments from Redis cache
    try {
      const cashPaymentIds = await redis.smembers(`cash-payments:pending:${restaurantId}`);
      const cashPayments = [];
      const staleCashIds = [];

      for (const id of cashPaymentIds) {
        const d = await redis.get(`cash-payment:pending:${id}`);
        if (d) {
          cashPayments.push(JSON.parse(d));
        } else {
          staleCashIds.push(id);
        }
      }

      if (staleCashIds.length > 0) {
        await redis.srem(`cash-payments:pending:${restaurantId}`, ...staleCashIds);
      }

      socket.emit('kitchen:initial:cash-payments', cashPayments);
      console.log(`[Kitchen] Sent ${cashPayments.length} pending cash payments to ${socket.id}`);
    } catch (error) {
      console.error('[Kitchen] Error sending cash payments:', error);
    }
  });

  // ── Customer table joins ──────────────────────────────────────────────────
  socket.on('table:join', ({ restaurantId, tableId }) => {
    const room = `table:restaurant_${restaurantId}_table_${tableId}`;
    socket.join(room);
    console.log(`[Table] Socket ${socket.id} joined ${room}`);
  });

  // ── Customer session joins (live participant + waiter request updates) ────
  socket.on('session:join', (sessionId) => {
    const room = `session:${sessionId}`;
    socket.join(room);
    console.log(`[Session] Socket ${socket.id} joined ${room}`);
  });

  socket.on('session:leave', (sessionId) => {
    socket.leave(`session:${sessionId}`);
    console.log(`[Session] Socket ${socket.id} left session:${sessionId}`);
  });

  socket.on('table:leave', ({ restaurantId, tableId }) => {
    socket.leave(`table:restaurant_${restaurantId}_table_${tableId}`);
    console.log(`[Table] Socket ${socket.id} left table room`);
  });

  // ── Cart sync — relay to other devices in the same session ───────────────
  socket.on('cart:sync', async ({ sessionId, items }) => {
    const room = `session:${sessionId}`;
    if (!socket.rooms.has(room)) {
      console.log(`[Cart] Sync from ${socket.id} REJECTED — not in room ${room}`);
      return;
    }
    const sockets = await io.in(room).fetchSockets();
    const othersCount = sockets.filter(s => s.id !== socket.id).length;
    socket.to(room).emit('cart:sync', { sessionId, items });
    console.log(`[Cart] Sync from ${socket.id} → session ${sessionId} (${items.length} items, ${othersCount} other(s))`);
  });

  // ── Kitchen staff: update food order status ───────────────────────────────
  socket.on('order:update:status', async ({ orderId, status }) => {
    console.log(`[Orders] Status update request: order ${orderId} → ${status}`);
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${process.env.LARAVEL_API_URL}/api/webhooks/order-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status })
      });
      if (!response.ok) throw new Error(`Webhook failed: ${response.statusText}`);
      console.log(`[Orders] Order ${orderId} status updated via webhook`);
    } catch (error) {
      console.error('[Orders] Error updating order status:', error);
      socket.emit('error', { message: 'Failed to update order status' });
    }
  });

  // ── Kitchen staff: acknowledge waiter request ─────────────────────────────
  socket.on('waiter:request:acknowledge', async ({ requestId }) => {
    console.log(`[Waiter] Acknowledge request ${requestId}`);
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${process.env.LARAVEL_API_URL}/api/webhooks/waiter-request-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action: 'acknowledge' })
      });
      if (!response.ok) throw new Error(`Webhook failed: ${response.statusText}`);
      console.log(`[Waiter] Request ${requestId} acknowledged`);
    } catch (error) {
      console.error('[Waiter] Error acknowledging request:', error);
      socket.emit('error', { message: 'Failed to acknowledge request' });
    }
  });

  // ── Kitchen staff: resolve waiter request ────────────────────────────────
  socket.on('waiter:request:resolve', async ({ requestId }) => {
    console.log(`[Waiter] Resolve request ${requestId}`);
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${process.env.LARAVEL_API_URL}/api/webhooks/waiter-request-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action: 'resolve' })
      });
      if (!response.ok) throw new Error(`Webhook failed: ${response.statusText}`);
      console.log(`[Waiter] Request ${requestId} resolved`);
    } catch (error) {
      console.error('[Waiter] Error resolving request:', error);
      socket.emit('error', { message: 'Failed to resolve request' });
    }
  });

  // ── Kitchen staff: dismiss flagged feedback alert ────────────────────
  socket.on('feedback:flag:dismiss', async ({ feedbackId, restaurantId }) => {
    console.log(`[Feedback] Dismiss flagged feedback ${feedbackId}`);
    await redis.srem(`feedback:flagged:${restaurantId}`, String(feedbackId));
    await redis.del(`feedback:flagged:${feedbackId}:details`);
    io.to(`kitchen:restaurant_${restaurantId}`).emit('feedback:flag:dismissed', { feedbackId });
    console.log(`[Feedback] Flagged feedback ${feedbackId} dismissed`);
  });

  // ── Kitchen staff: update reservation status ─────────────────────────
  socket.on('reservation:status:update', async ({ reservationId, status }) => {
    console.log(`[Reservation] Status update request: reservation ${reservationId} → ${status}`);
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${process.env.LARAVEL_API_URL}/api/webhooks/reservation-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reservationId, status })
      });
      if (!response.ok) throw new Error(`Webhook failed: ${response.statusText}`);
      console.log(`[Reservation] Reservation ${reservationId} status updated via webhook`);
    } catch (error) {
      console.error('[Reservation] Error updating reservation status:', error);
      socket.emit('error', { message: 'Failed to update reservation status' });
    }
  });

  // ── Kitchen staff: update queue entry status ─────────────────────────
  socket.on('queue:status:update', async ({ entryId, status }) => {
    console.log(`[Queue] Status update request: entry ${entryId} → ${status}`);
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${process.env.LARAVEL_API_URL}/api/webhooks/queue-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, status })
      });
      if (!response.ok) throw new Error(`Webhook failed: ${response.statusText}`);
      console.log(`[Queue] Entry ${entryId} status updated via webhook`);
    } catch (error) {
      console.error('[Queue] Error updating queue entry status:', error);
      socket.emit('error', { message: 'Failed to update queue entry status' });
    }
  });

  // ── Kitchen staff: confirm cash payment ─────────────────────────────────
  socket.on('cash:payment:confirm', async ({ paymentId, restaurantId }) => {
    console.log(`[Payment] Staff confirming cash payment ${paymentId} for restaurant ${restaurantId}`);
    // Remove from Redis cache (Laravel API handles the actual DB update via confirmCashPayment)
    await redis.srem(`cash-payments:pending:${restaurantId}`, String(paymentId));
    await redis.del(`cash-payment:pending:${paymentId}`);
    io.to(`kitchen:restaurant_${restaurantId}`).emit('cash:payment:confirmed', { paymentId });
    console.log(`[Payment] Cash payment ${paymentId} removed from KDS`);
  });

  // ── Disconnect / error ───────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[Socket] Error for ${socket.id}:`, error);
  });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] Socket.io running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
  console.log(`[Server] Redis URL: ${process.env.REDIS_URL}`);
  console.log(`[Server] Redis channel prefix: ${REDIS_PREFIX}`);
  console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down…');
  server.close(() => {
    redis.disconnect();
    redisSubscriber.disconnect();
    console.log('[Server] Closed');
    process.exit(0);
  });
});
