'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { Portal } from '@/components/Portal';
import type { CartItemCustomization } from '@/types/cart';
import { buildCartLineKey } from '@/types/cart';
import {
  IngredientPicker,
  computeCustomizationExtra,
  type AdjustableIngredient,
} from '@/components/Menu/IngredientPicker';
import { MenuItemRating, TopRatedBadge, isTopRated } from '@/components/Menu/MenuItemRating';

interface Ingredient {
  id: number;
  name: string;
  unit?: string | null;
  is_allergen: boolean;
  allergen_type: string | null;
  pivot: {
    quantity?: number;
    is_optional: boolean;
    is_removable: boolean;
    is_adjustable?: boolean;
    min_quantity?: number;
    max_quantity?: number | null;
    extra_unit_price?: number;
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
  review_count?: number;
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
  adjustableIngredients,
  quantities,
  onQuantityChange,
}: {
  item: MenuItemDetail;
  onClose: () => void;
  adjustableIngredients: AdjustableIngredient[];
  quantities: Record<number, number>;
  onQuantityChange: (ingredientId: number, quantity: number) => void;
}) {
  const spice = item.spice_level ? SPICE_LABELS[item.spice_level] : null;
  const displayIngredients = item.ingredients.filter((ing) => !ing.pivot?.is_adjustable);
  const topRated = isTopRated(item.average_rating, item.review_count);
  const ratingRow = (
    <MenuItemRating
      averageRating={item.average_rating}
      reviewCount={item.review_count}
      showCount
    />
  );

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
          <div className="flex flex-col gap-1 items-end shrink-0 mt-1">
            {item.is_signature && (
              <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Signature
              </span>
            )}
            {topRated && <TopRatedBadge className="px-2.5" />}
          </div>
        </div>

        {(ratingRow || item.total_orders > 0) && (
          <div className="flex items-center gap-3 mb-3">
            {ratingRow}
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

        <IngredientPicker
          ingredients={adjustableIngredients}
          quantities={quantities}
          onChange={onQuantityChange}
        />

        {displayIngredients.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-sans font-semibold text-gray-500 uppercase tracking-wider mb-3">Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {displayIngredients.map((ing) => (
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
            {displayIngredients.some((i) => i.is_allergen) && (
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
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const cartQty = items
    .filter((i) => i.id === itemId)
    .reduce((sum, i) => sum + i.quantity, 0);

  const adjustableIngredients = useMemo<AdjustableIngredient[]>(() => {
    if (!item?.ingredients) return [];
    return item.ingredients
      .filter((ing) => Boolean(ing.pivot?.is_adjustable))
      .map((ing) => ({
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        is_allergen: ing.is_allergen,
        allergen_type: ing.allergen_type,
        pivot: {
          quantity: Number(ing.pivot.quantity ?? 0),
          is_adjustable: true,
          min_quantity: Number(ing.pivot.min_quantity ?? 0),
          max_quantity: ing.pivot.max_quantity != null ? Number(ing.pivot.max_quantity) : null,
          extra_unit_price: Number(ing.pivot.extra_unit_price ?? 0),
        },
      }));
  }, [item]);

  const customizationExtra = useMemo(
    () => computeCustomizationExtra(adjustableIngredients, quantities),
    [adjustableIngredients, quantities]
  );

  const unitPrice = (item ? Number(item.base_price) : 0) + customizationExtra;

  const fetchItem = useCallback(async (id: number) => {
    setLoading(true);
    setItem(null);
    setQty(1);
    setAdded(false);
    setQuantities({});
    try {
      const data = await api.getMenuItem(id);
      setItem(data);
      const initial: Record<number, number> = {};
      for (const ing of data.ingredients ?? []) {
        if (ing.pivot?.is_adjustable) {
          initial[ing.id] = Number(ing.pivot.quantity ?? 0);
        }
      }
      setQuantities(initial);
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

  function handleQuantityChange(ingredientId: number, quantity: number) {
    setQuantities((prev) => ({ ...prev, [ingredientId]: quantity }));
  }

  function buildCustomizations(): CartItemCustomization[] {
    return adjustableIngredients
      .map((ing) => {
        const defaultQty = Number(ing.pivot.quantity ?? 0);
        const chosen = quantities[ing.id] ?? defaultQty;
        const extraUnits = Math.max(0, chosen - defaultQty);
        const priceAdjustment = extraUnits * Number(ing.pivot.extra_unit_price ?? 0);

        return {
          ingredient_id: ing.id,
          name: ing.name,
          quantity: chosen,
          default_quantity: defaultQty,
          unit: ing.unit ?? undefined,
          extra_unit_price: Number(ing.pivot.extra_unit_price ?? 0),
          price_adjustment: priceAdjustment,
        };
      })
      .filter((c) => c.quantity !== c.default_quantity);
  }

  function handleAddToCart() {
    if (!item) return;
    const customizations = buildCustomizations();
    const lineKey = buildCartLineKey(item.id, customizations);

    for (let i = 0; i < qty; i++) {
      addItem({
        id: item.id,
        name: item.name,
        description: item.description,
        base_price: Number(item.base_price),
        image_url: item.image_url,
        is_signature: item.is_signature,
        unitPrice,
        customizations,
        lineKey,
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
              <ItemContent
                item={item}
                onClose={onClose}
                adjustableIngredients={adjustableIngredients}
                quantities={quantities}
                onQuantityChange={handleQuantityChange}
              />
            )}
          </div>

          {/* Sticky footer */}
          {!loading && item && (
            <div className="px-5 pt-4 pb-6 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs font-sans text-gray-400 uppercase tracking-wider">Price</p>
                  <p className="text-2xl font-display font-bold text-gray-900">
                    Rs {(unitPrice * qty).toLocaleString('en-PK')}
                  </p>
                  {customizationExtra > 0 && (
                    <p className="text-[11px] font-sans text-orange-500 mt-0.5">
                      Includes +Rs {customizationExtra.toLocaleString('en-PK')} extras
                    </p>
                  )}
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
