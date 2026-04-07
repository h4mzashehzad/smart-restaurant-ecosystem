'use client';

import { useState, useEffect } from 'react';

interface OrderItem {
  id: number;
  quantity: number;
  menu_item: { name: string; preparation_time?: number };
  customization_notes?: string;
}

interface KDSOrder {
  id: number;
  order_number: string;
  status: string;
  placed_at: string;
  estimated_completion_at: string;
  table: { table_number: string } | null;
  items: OrderItem[];
  special_instructions?: string;
  user?: { name: string } | null;
}

interface KDSOrderTicketProps {
  order: KDSOrder;
  onStatusUpdate: (orderId: number, status: string) => void;
}

type UrgencyLevel = 'green' | 'yellow' | 'red' | 'overdue';

function getUrgency(estimatedCompletionAt: string): UrgencyLevel {
  const now = Date.now();
  const target = new Date(estimatedCompletionAt).getTime();
  const diffMinutes = (target - now) / 60000;

  if (diffMinutes < 0) return 'overdue';
  if (diffMinutes < 5) return 'red';
  if (diffMinutes <= 10) return 'yellow';
  return 'green';
}

function getElapsedTime(placedAt: string): string {
  const diff = Date.now() - new Date(placedAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

const urgencyStyles: Record<UrgencyLevel, { card: string; badge: string; label: string }> = {
  green: {
    card: 'bg-emerald-50 border-emerald-300',
    badge: 'bg-emerald-500',
    label: 'On Track',
  },
  yellow: {
    card: 'bg-amber-50 border-amber-300',
    badge: 'bg-amber-500',
    label: 'Hurry',
  },
  red: {
    card: 'bg-red-50 border-red-300',
    badge: 'bg-red-500',
    label: 'Urgent',
  },
  overdue: {
    card: 'bg-red-100 border-red-400 animate-pulse',
    badge: 'bg-red-600',
    label: 'OVERDUE',
  },
};

const nextStatusMap: Record<string, { label: string; status: string }> = {
  pending: { label: 'Start Preparing', status: 'preparing' },
  confirmed: { label: 'Start Preparing', status: 'preparing' },
  preparing: { label: 'Mark Ready', status: 'ready' },
  ready: { label: 'Mark Served', status: 'served' },
};

export default function KDSOrderTicket({ order, onStatusUpdate }: KDSOrderTicketProps) {
  const [urgency, setUrgency] = useState<UrgencyLevel>(() =>
    getUrgency(order.estimated_completion_at)
  );
  const [elapsed, setElapsed] = useState(() => getElapsedTime(order.placed_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setUrgency(getUrgency(order.estimated_completion_at));
      setElapsed(getElapsedTime(order.placed_at));
    }, 1000);

    return () => clearInterval(interval);
  }, [order.estimated_completion_at, order.placed_at]);

  const style = urgencyStyles[urgency];
  const nextAction = nextStatusMap[order.status];

  return (
    <div
      className={`rounded-2xl border-2 ${style.card} p-4 flex flex-col gap-3 shadow-sm transition-colors duration-300`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-lg font-bold font-display text-gray-900 truncate">
            {order.order_number}
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            {order.table ? `Table ${order.table.table_number}` : 'No table'}
            <span className="mx-1.5 text-gray-300">|</span>
            {elapsed}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`${style.badge} text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full`}
          >
            {style.label}
          </span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            {order.status}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="border-t border-gray-200/60 pt-2 space-y-1.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <span className="text-sm font-bold text-gray-700 w-6 text-right shrink-0">
              {item.quantity}x
            </span>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-gray-800 leading-tight">
                {item.menu_item?.name ?? 'Unknown item'}
              </span>
              {item.customization_notes && (
                <p className="text-xs text-gray-500 italic truncate">
                  {item.customization_notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Special instructions */}
      {order.special_instructions && (
        <div className="bg-white/60 rounded-xl px-3 py-2 border border-gray-200/50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
            Notes
          </p>
          <p className="text-sm text-gray-700 font-medium">{order.special_instructions}</p>
        </div>
      )}

      {/* Action button */}
      {nextAction && (
        <button
          onClick={() => onStatusUpdate(order.id, nextAction.status)}
          className="mt-auto w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] shadow-md shadow-orange-500/20 transition-all"
        >
          {nextAction.label}
        </button>
      )}
    </div>
  );
}
