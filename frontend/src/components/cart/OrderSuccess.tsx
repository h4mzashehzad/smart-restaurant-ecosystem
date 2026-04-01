'use client';

interface OrderSuccessProps {
  orderNumber: string;
  onDone: () => void;
}

export function OrderSuccess({ orderNumber, onDone }: OrderSuccessProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center animate-fade-in-up">
      {/* Success ring animation */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-11 h-11 text-green-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
      </div>

      <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Order Placed!</h2>
      <p className="text-sm font-sans text-gray-500 leading-relaxed mb-1">
        Your order is being prepared by the kitchen.
      </p>
      <div className="mt-3 px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100">
        <p className="text-xs text-orange-400 font-sans font-medium uppercase tracking-wider">Order Number</p>
        <p className="text-lg font-display font-bold text-orange-600 mt-0.5">{orderNumber}</p>
      </div>

      <p className="text-xs text-gray-400 font-sans mt-4 leading-relaxed max-w-xs">
        Sit back and relax — we'll bring it right to your table.
      </p>

      <button
        onClick={onDone}
        className="mt-8 w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl
                   shadow-lg shadow-orange-500/25 hover:bg-orange-600
                   active:scale-[0.98] transition-all"
      >
        Back to Menu
      </button>
    </div>
  );
}
