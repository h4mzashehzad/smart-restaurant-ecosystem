'use client';

import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQty, removeItem } = useCart();

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-gray-100 last:border-none">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 15.75V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75v-3z" />
            </svg>
          </div>
        )}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-gray-900 text-sm leading-tight truncate">{item.name}</p>
        <p className="text-xs text-gray-500 font-sans mt-0.5">
          Rs {item.unitPrice.toLocaleString('en-PK')} each
        </p>
        <p className="text-sm font-sans font-bold text-orange-500 mt-0.5">
          Rs {(item.unitPrice * item.quantity).toLocaleString('en-PK')}
        </p>
      </div>

      {/* Quantity stepper + remove */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 bg-gray-50 rounded-2xl p-1 border border-gray-100">
          <button
            onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQty(item.id, item.quantity - 1)}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:text-orange-500 transition-all active:scale-90"
            aria-label="Decrease quantity"
          >
            {item.quantity === 1 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            )}
          </button>
          <span className="w-6 text-center font-display font-bold text-gray-900 text-sm">{item.quantity}</span>
          <button
            onClick={() => updateQty(item.id, item.quantity + 1)}
            disabled={item.quantity >= 10}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all active:scale-90 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
