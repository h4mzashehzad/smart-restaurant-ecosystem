'use client';

export interface TrackerPayment {
  id: number;
  participant_id: number | null;
  amount: number;
  status: string;
  payment_method?: string;
  label?: string;
}

interface PaymentStatusTrackerProps {
  payments: TrackerPayment[];
  myParticipantId?: number | null;
  onPay?: (payment: TrackerPayment, method: 'cash' | 'safepay') => void;
  payingId?: number | null;
  participantLabel?: (participantId: number | null | undefined) => string;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-sky-100 text-sky-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

export function PaymentStatusTracker({
  payments,
  myParticipantId,
  onPay,
  payingId,
  participantLabel,
}: PaymentStatusTrackerProps) {
  const paid = payments.filter((p) => p.status === 'completed').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-sans text-stone-500">
        <span>
          {paid} of {payments.length} paid
        </span>
        <div className="h-1.5 w-24 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${payments.length ? (paid / payments.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {payments.map((p) => {
          const mine = p.participant_id === myParticipantId;
          const canPay = mine && ['pending', 'failed', 'expired'].includes(p.status);
          const name =
            p.label ||
            participantLabel?.(p.participant_id) ||
            (mine ? 'You' : `Guest #${p.participant_id}`);

          return (
            <div
              key={p.id}
              className={`rounded-2xl border px-3.5 py-3 transition-colors ${
                mine ? 'border-orange-200 bg-orange-50/50' : 'border-stone-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-sans font-semibold text-gray-900 truncate">
                    {name}
                    {mine && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-orange-600">You</span>}
                  </div>
                  <div className="text-xs font-sans text-gray-500 mt-0.5">
                    Rs {Number(p.amount).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                    {p.payment_method
                      ? ` · ${p.payment_method === 'safepay' ? 'card' : p.payment_method}`
                      : ''}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-sans font-semibold px-2 py-1 rounded-full capitalize shrink-0 ${
                    statusStyles[p.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              {canPay && onPay && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    disabled={payingId === p.id}
                    onClick={() => onPay(p, 'cash')}
                    className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-semibold disabled:opacity-60 active:scale-[0.98]"
                  >
                    Pay Cash
                  </button>
                  <button
                    type="button"
                    disabled={payingId === p.id}
                    onClick={() => onPay(p, 'safepay')}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-semibold disabled:opacity-60 active:scale-[0.98]"
                  >
                    Pay with Card
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
