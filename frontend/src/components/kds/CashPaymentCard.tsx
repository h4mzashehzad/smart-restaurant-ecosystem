'use client';

export interface PendingCashPayment {
  paymentId: number;
  sessionId: number;
  participantId: number | null;
  amount: number;
  tableNumber: string;
  splitGroupId: string | null;
  paymentType: string;
}

interface CashPaymentCardProps {
  payment: PendingCashPayment;
  onConfirm: (paymentId: number) => void;
}

export default function CashPaymentCard({ payment, onConfirm }: CashPaymentCardProps) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Table {payment.tableNumber}</p>
              <h3 className="text-xl font-display font-bold text-gray-900 mt-0.5">Cash Payment</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
          <p className="text-sm text-gray-500 mb-1">Amount Due</p>
          <p className="text-3xl font-display font-bold text-orange-500">
            Rs {Number(payment.amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })}
          </p>
        </div>
        
        {payment.splitGroupId && (
          <p className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl mb-4 inline-block">
            Part of a Split Bill
          </p>
        )}
      </div>

      <button
        onClick={() => onConfirm(payment.paymentId)}
        className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Confirm Received
      </button>
    </div>
  );
}
