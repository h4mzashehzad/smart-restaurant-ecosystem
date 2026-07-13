'use client';

import Image from 'next/image';
import type { AdminMenuItem, AdminMenuItemIngredient } from '@/types/admin';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SPICE_LABELS: Record<string, { label: string; color: string }> = {
  mild: { label: 'Mild', color: 'text-green-600 bg-green-50 border-green-100' },
  medium: { label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-100' },
  hot: { label: 'Hot', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  extra_hot: { label: 'Extra Hot', color: 'text-red-600 bg-red-50 border-red-100' },
};

function formatPkr(amount: number) {
  return `Rs ${Number(amount).toLocaleString('en-PK')}`;
}

interface MenuItemPreviewModalProps {
  item: AdminMenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MenuItemPreviewModal({ item, open, onOpenChange }: MenuItemPreviewModalProps) {
  if (!item) return null;

  const spice = item.spice_level && item.spice_level !== 'none' ? SPICE_LABELS[item.spice_level] : null;
  const ingredients = (item.ingredients ?? []) as AdminMenuItemIngredient[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Preview {item.name}</DialogTitle>
        </DialogHeader>

        {item.image_url ? (
          <div className="relative h-56 w-full overflow-hidden">
            <Image
              key={`${item.id}-${item.updated_at ?? ''}-${item.image_url}`}
              src={
                item.updated_at
                  ? `${item.image_url}${item.image_url.includes('?') ? '&' : '?'}v=${encodeURIComponent(item.updated_at)}`
                  : item.image_url
              }
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="relative flex h-36 w-full items-center justify-center bg-gray-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-14 w-14 text-gray-200">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 15.75V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v9a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75v-3z"
              />
            </svg>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-200 text-gray-500 transition-colors hover:bg-gray-300"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="px-5 pt-4 pb-6">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h2 className="flex-1 font-display text-2xl font-bold leading-tight text-gray-900">{item.name}</h2>
            {item.is_signature && (
              <span className="mt-1 shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Signature
              </span>
            )}
          </div>

          <p className="mb-3 text-base font-bold text-gray-900">{formatPkr(item.base_price)}</p>

          {item.description && (
            <p className="mb-4 text-sm leading-relaxed text-gray-500">{item.description}</p>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {item.is_vegetarian && (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Vegetarian
              </span>
            )}
            {item.is_vegan && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Vegan
              </span>
            )}
            {item.is_gluten_free && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Gluten Free
              </span>
            )}
            {spice && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${spice.color}`}
              >
                {spice.label}
              </span>
            )}
          </div>

          <div className="mb-5 flex gap-3">
            {item.calories != null && item.calories > 0 && (
              <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="font-display text-lg font-bold text-gray-900">{item.calories}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">kcal</p>
              </div>
            )}
            {item.preparation_time != null && item.preparation_time > 0 && (
              <div className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="font-display text-lg font-bold text-gray-900">{item.preparation_time}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">min</p>
              </div>
            )}
            {item.cuisine_type && (
              <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-center">
                <p className="truncate font-display text-sm font-bold capitalize text-gray-900">
                  {item.cuisine_type}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Cuisine</p>
              </div>
            )}
          </div>

          {ingredients.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Ingredients
              </h3>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing) => (
                  <span
                    key={ing.id}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      ing.is_allergen
                        ? 'border-red-100 bg-red-50 text-red-600'
                        : 'border-gray-100 bg-gray-50 text-gray-600'
                    }`}
                  >
                    {ing.name}
                    {ing.pivot?.is_optional ? ' (optional)' : ''}
                    {ing.is_allergen ? ' ⚠' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-5 text-center text-[11px] text-gray-400">
            Customer preview — how guests see this dish
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
