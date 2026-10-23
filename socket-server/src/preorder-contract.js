function isKitchenOrder(order) {
  return !order.reservation_id || (Boolean(order.kitchen_released_at) && ['confirmed', 'preparing', 'ready'].includes(order.status));
}

function shouldNotifyTable(order) {
  return !order.reservation_id || Boolean(order.session_id);
}

function orderStatusPayload(orderId, status) {
  return { orderId, order_id: orderId, status };
}

module.exports = { isKitchenOrder, shouldNotifyTable, orderStatusPayload };
