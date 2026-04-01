'use client';

import { useCart } from '@/contexts/CartContext';

interface CartFabProps {
  onClick: () => void;
}

export function CartFab({ onClick }: CartFabProps) {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] w-full max-w-md px-4 pointer-events-none">
      <button
        onClick={onClick}
        className="pointer-events-auto w-full flex items-center justify-between
                   bg-gray-900 text-white rounded-2xl px-5 py-4
                   shadow-[0_8px_32px_rgba(0,0,0,0.25)]
                   hover:bg-gray-800 active:scale-[0.98] transition-all duration-200
                   animate-fade-in-up"
        aria-label={`View cart — ${itemCount} items`}
      >
        {/* Left: cart icon + item count badge */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 border-2 border-gray-900 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          </div>
          <span className="font-display font-bold text-sm">View Cart</span>
        </div>

        {/* Right: total */}
        <span className="font-display font-bold text-sm text-orange-400">
          Rs {total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
        </span>
      </button>
    </div>
  );
}
