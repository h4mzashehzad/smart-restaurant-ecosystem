'use client';

interface PaymentSuccessProps {
  orderNumber: string;
  amount?: number;
  receiptUrl?: string | null;
  onDone: () => void;
}

export function PaymentSuccess({ orderNumber, amount, receiptUrl, onDone }: PaymentSuccessProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-emerald-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h2 className="font-display text-xl font-bold text-gray-900">Payment Confirmed</h2>
      <p className="text-sm font-sans text-gray-500 mt-1">Order {orderNumber}</p>
      {amount != null && (
        <p className="text-base font-display font-bold text-orange-500 mt-3">
          Rs {amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
        </p>
      )}
      {receiptUrl && (
        <a
          href={receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 text-sm font-sans font-semibold text-orange-600 underline"
        >
          Download Receipt
        </a>
      )}
      <button
        type="button"
        onClick={onDone}
        className="mt-8 w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/25"
      >
        Done
      </button>
    </div>
  );
}
