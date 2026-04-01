'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { Portal } from '@/components/Portal';

interface Ingredient {
  id: number;
  name: string;
  is_allergen: boolean;
  allergen_type: string | null;
  pivot: {
    is_optional: boolean;
    is_removable: boolean;
    additional_price: number;
  };
}

interface MenuItemDetail {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image_url: string | null;
  is_signature: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  spice_level: string | null;
  cuisine_type: string | null;
  calories: number | null;
  preparation_time: number | null;
  average_rating: number | null;
  total_orders: number;
  ingredients: Ingredient[];
}

interface ItemDetailDrawerProps {
  itemId: number | null;
  onClose: () => void;
}

const SPICE_LABELS: Record<string, { label: string; color: string }> = {
  mild: { label: 'Mild', color: 'text-green-600 bg-green-50 border-green-100' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  hot: { label: 'Hot', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  extra_hot: { label: 'Extra Hot', color: 'text-red-600 bg-red-50 border-red-100' },
};

function ItemContent({
  item,
  onClose,
}: {
  item: MenuItemDetail;
  onClose: () => void;
}) {
  const spice = item.spice_level ? SPICE_LABELS[item.spice_level] : null;
  return (
    <div className="pb-4">
      {/* Hero Image — flush to top, close button overlaid */}
      {item.image_url ? (
        <div className="relative w-full h-56 overflow-hidden">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors active:scale-95"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative w-full h-36 bg-gray-100 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-14 h-14 text-gray-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 15.75V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75v-3z" />
          </svg>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 transition-colors active:scale-95"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="px-5 pt-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-2xl font-display font-bold text-gray-900 leading-tight flex-1">
            {item.name}
          </h2>
          {item.is_signature && (
            <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 mt-1">
              Signature
            </span>
          )}
        </div>

        {(item.average_rating || item.total_orders > 0) && (
          <div className="flex items-center gap-3 mb-3">
            {item.average_rating && (
              <div className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-400">
                  <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
                </svg>
                <span className="text-sm font-sans font-semibold text-gray-700">{parseFloat(String(item.average_rating)).toFixed(1)}</span>
              </div>
            )}
            {item.total_orders > 0 && (
              <span className="text-xs font-sans text-gray-400">{item.total_orders.toLocaleString()} orders</span>
            )}
          </div>
        )}

        {item.description && (
          <p className="text-sm font-sans text-gray-500 leading-relaxed mb-4">{item.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {item.is_vegetarian && (
            <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2.5 py-1 rounded-full border text-green-700 bg-green-50 border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Vegetarian
            </span>
          )}
          {item.is_vegan && (
            <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2.5 py-1 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Vegan
            </span>
          )}
          {item.is_gluten_free && (
            <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold px-2.5 py-1 rounded-full border text-blue-700 bg-blue-50 border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Gluten Free
            </span>
          )}
          {spice && (
            <span className={`inline-flex items-center gap-1 text-xs font-sans font-semibold px-2.5 py-1 rounded-full border ${spice.color}`}>
              🌶 {spice.label}
            </span>
          )}
        </div>

        <div className="flex gap-3 mb-5">
          {item.calories && (
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
              <p className="text-lg font-display font-bold text-gray-900">{item.calories}</p>
              <p className="text-[10px] font-sans text-gray-400 uppercase tracking-wider">kcal</p>
            </div>
          )}
          {item.preparation_time && (
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
              <p className="text-lg font-display font-bold text-gray-900">{item.preparation_time}</p>
              <p className="text-[10px] font-sans text-gray-400 uppercase tracking-wider">min</p>
            </div>
          )}
          {item.cuisine_type && (
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center border border-gray-100 min-w-0">
              <p className="text-sm font-display font-bold text-gray-900 truncate capitalize">{item.cuisine_type}</p>
              <p className="text-[10px] font-sans text-gray-400 uppercase tracking-wider">Cuisine</p>
            </div>
          )}
        </div>

        {item.ingredients && item.ingredients.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-sans font-semibold text-gray-500 uppercase tracking-wider mb-3">Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {item.ingredients.map((ing) => (
                <span
                  key={ing.id}
                  className={`text-xs font-sans px-2.5 py-1 rounded-full border ${ing.is_allergen ? 'text-red-600 bg-red-50 border-red-100' : 'text-gray-600 bg-gray-50 border-gray-100'}`}
                >
                  {ing.name}
                  {ing.is_allergen && ' ⚠'}
                  {ing.pivot?.additional_price > 0 && (
                    <span className="ml-1 text-orange-500">+Rs {ing.pivot.additional_price}</span>
                  )}
                </span>
              ))}
            </div>
            {item.ingredients.some((i) => i.is_allergen) && (
              <p className="text-[11px] text-red-400 font-sans mt-2 flex items-center gap-1">
                <span>⚠</span> Contains allergens
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ItemDetailDrawer({ itemId, onClose }: ItemDetailDrawerProps) {
  const { addItem, items } = useCart();
  const [item, setItem] = useState<MenuItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const cartQty = items.find((i) => i.id === itemId)?.quantity ?? 0;

  const fetchItem = useCallback(async (id: number) => {
    setLoading(true);
    setItem(null);
    setQty(1);
    setAdded(false);
    try {
      const data = await api.getMenuItem(id);
      setItem(data);
    } catch {
      // silently fail — drawer will show error state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (itemId !== null) fetchItem(itemId);
  }, [itemId, fetchItem]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (itemId !== null) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [itemId]);

  function handleAddToCart() {
    if (!item) return;
    for (let i = 0; i < qty; i++) {
      addItem({
        id: item.id,
        name: item.name,
        description: item.description,
        base_price: item.base_price,
        image_url: item.image_url,
        is_signature: item.is_signature,
        unitPrice: item.base_price,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (itemId === null) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70]">
        <div className="animate-slide-up bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[92dvh]">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* Scrollable area */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="animate-pulse pb-6">
                <div className="w-full h-52 bg-gray-200 mb-5" />
                <div className="px-5">
                  <div className="h-7 bg-gray-200 rounded-2xl w-3/4 mb-3" />
                  <div className="h-4 bg-gray-200 rounded-xl w-full mb-2" />
                  <div className="h-4 bg-gray-200 rounded-xl w-5/6 mb-5" />
                  <div className="h-10 bg-gray-200 rounded-2xl w-1/3" />
                </div>
              </div>
            )}

            {!loading && !item && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-5">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="font-display font-bold text-gray-500">Couldn&apos;t load item details</p>
                <button onClick={() => itemId && fetchItem(itemId)} className="mt-3 text-sm text-orange-500 underline">
                  Try again
                </button>
              </div>
            )}

            {!loading && item && (
              <ItemContent item={item} onClose={onClose} />
            )}
          </div>

          {/* Sticky footer */}
          {!loading && item && (
            <div className="px-5 pt-4 pb-6 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs font-sans text-gray-400 uppercase tracking-wider">Price</p>
                  <p className="text-2xl font-display font-bold text-gray-900">
                    Rs {(item.base_price * qty).toLocaleString('en-PK')}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 rounded-2xl p-1 border border-gray-100">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white hover:text-orange-500 transition-all active:scale-90"
                    aria-label="Decrease"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                    </svg>
                  </button>
                  <span className="w-8 text-center font-display font-bold text-gray-900">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all active:scale-90"
                    aria-label="Increase"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`h-12 px-5 rounded-2xl font-semibold text-sm transition-all active:scale-[0.97] shadow-lg flex items-center gap-2 ${
                    added
                      ? 'bg-green-500 text-white shadow-green-500/25'
                      : 'bg-orange-500 text-white shadow-orange-500/25 hover:bg-orange-600'
                  }`}
                >
                  {added ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Added!
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {cartQty > 0 ? 'Add More' : 'Add'}
                    </>
                  )}
                </button>
              </div>

              {cartQty > 0 && (
                <p className="text-xs text-gray-400 font-sans text-center mt-2">
                  {cartQty} already in cart
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
