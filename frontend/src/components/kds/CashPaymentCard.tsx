'use client';

export interface CashPayment {
  id: number;
  amount: number;
  status: string;
  payment_method: string;
  created_at?: string;
  order?: {
    id: number;
    order_number: string;
    table_number?: string;
    table_id?: number;
    table?: { table_number?: string } | null;
    items_summary?: { name?: string; quantity: number }[];
  } | null;
}

interface CashPaymentCardProps {
  payment: CashPayment;
  onConfirm: (paymentId: number) => void;
  confirming?: boolean;
}

export default function CashPaymentCard({ payment, onConfirm, confirming }: CashPaymentCardProps) {
  const tableNumber = payment.order?.table_number ?? payment.order?.table?.table_number;
  const tableLabel = tableNumber
    ? `Table ${tableNumber}`
    : payment.order?.table_id
      ? `Table #${payment.order.table_id}`
      : 'Table —';

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-zinc-900/80 p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Cash</div>
          <div className="mt-1 font-semibold text-lg">{tableLabel}</div>
          <div className="text-sm text-zinc-400">{payment.order?.order_number ?? `Payment #${payment.id}`}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-300">
            Rs {Number(payment.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </div>
          {payment.created_at && (
            <div className="text-[11px] text-zinc-500 mt-1">
              {new Date(payment.created_at).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {payment.order?.items_summary && payment.order.items_summary.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-zinc-300">
          {payment.order.items_summary.slice(0, 4).map((item, idx) => (
            <li key={idx}>
              {item.quantity}× {item.name || 'Item'}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={confirming}
        onClick={() => onConfirm(payment.id)}
        className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {confirming ? 'Confirming…' : 'Confirm Payment'}
      </button>
    </div>
  );
}
