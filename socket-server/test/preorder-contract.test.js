const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isKitchenOrder, shouldNotifyTable, orderStatusPayload } = require('../src/preorder-contract');

test('unpaid, scheduled and cancelled reservation orders never become kitchen tickets', () => {
  for (const status of ['pending_payment', 'scheduled', 'cancelled']) {
    assert.equal(isKitchenOrder({ reservation_id: 1, status }), false);
    assert.equal(isKitchenOrder({ reservation_id: 1, status, kitchen_released_at: '2026-10-24T13:00:00Z' }), false);
  }
});
test('a paid preorder appears only after its persisted kitchen release', () => {
  for (const status of ['confirmed', 'preparing', 'ready']) {
    assert.equal(isKitchenOrder({ reservation_id: 1, status }), false);
    assert.equal(isKitchenOrder({ reservation_id: 1, status, kitchen_released_at: '2026-10-24T13:00:00Z' }), true);
  }
});
test('dine-in orders keep their existing kitchen delivery behavior', () => {
  assert.equal(isKitchenOrder({ status: 'confirmed' }), true);
  assert.equal(shouldNotifyTable({ table_id: 1 }), true);
});
test('preorders do not send events to unrelated guests currently using the table', () => {
  assert.equal(shouldNotifyTable({ reservation_id: 1, table_id: 1, session_id: null }), false);
  assert.equal(shouldNotifyTable({ reservation_id: 1, table_id: 1, session_id: 10 }), true);
});
test('food status updates support the existing table and kitchen field names', () => {
  assert.deepEqual(orderStatusPayload(21, 'ready'), { orderId: 21, order_id: 21, status: 'ready' });
});
