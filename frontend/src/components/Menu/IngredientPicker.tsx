'use client';

export interface AdjustableIngredient {
  id: number;
  name: string;
  unit?: string | null;
  is_allergen?: boolean;
  allergen_type?: string | null;
  pivot: {
    quantity: number;
    is_adjustable?: boolean;
    min_quantity?: number;
    max_quantity?: number | null;
    extra_unit_price?: number;
  };
}

interface IngredientPickerProps {
  ingredients: AdjustableIngredient[];
  quantities: Record<number, number>;
  onChange: (ingredientId: number, quantity: number) => void;
}

export function computeCustomizationExtra(
  ingredients: AdjustableIngredient[],
  quantities: Record<number, number>
): number {
  return ingredients.reduce((sum, ing) => {
    const defaultQty = Number(ing.pivot.quantity ?? 0);
    const chosen = quantities[ing.id] ?? defaultQty;
    const extraUnits = Math.max(0, chosen - defaultQty);
    return sum + extraUnits * Number(ing.pivot.extra_unit_price ?? 0);
  }, 0);
}

export function IngredientPicker({ ingredients, quantities, onChange }: IngredientPickerProps) {
  if (ingredients.length === 0) return null;

  const extraTotal = computeCustomizationExtra(ingredients, quantities);

  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-sans font-semibold text-gray-500 uppercase tracking-wider">
          Customize
        </h3>
        {extraTotal > 0 && (
          <span className="text-xs font-sans font-semibold text-orange-500">
            +Rs {extraTotal.toLocaleString('en-PK')}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {ingredients.map((ing) => {
          const defaultQty = Number(ing.pivot.quantity ?? 0);
          const min = Number(ing.pivot.min_quantity ?? 0);
          const max =
            ing.pivot.max_quantity != null ? Number(ing.pivot.max_quantity) : Math.max(defaultQty, 10);
          const value = quantities[ing.id] ?? defaultQty;
          const extraUnitPrice = Number(ing.pivot.extra_unit_price ?? 0);
          const delta = value - defaultQty;

          return (
            <div
              key={ing.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-3.5 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-sans font-semibold text-gray-900">{ing.name}</p>
                <p className="mt-0.5 text-[11px] font-sans text-gray-400">
                  Included: {defaultQty}
                  {ing.unit ? ` ${ing.unit}` : ''}
                  {extraUnitPrice > 0 && (
                    <span className="text-orange-500">
                      {' '}
                      · +Rs {extraUnitPrice.toLocaleString('en-PK')} / extra
                    </span>
                  )}
                </p>
                {delta !== 0 && (
                  <p className="mt-0.5 text-[11px] font-sans font-medium text-gray-500">
                    {delta > 0 ? `+${delta}` : delta} from default
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 rounded-2xl border border-gray-100 bg-white p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onChange(ing.id, Math.max(min, value - 1))}
                  disabled={value <= min}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-50 hover:text-orange-500 active:scale-90 disabled:opacity-40"
                  aria-label={`Decrease ${ing.name}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                  </svg>
                </button>
                <span className="w-7 text-center font-display text-sm font-bold text-gray-900">{value}</span>
                <button
                  type="button"
                  onClick={() => onChange(ing.id, Math.min(max, value + 1))}
                  disabled={value >= max}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-orange-500 transition-all hover:bg-orange-50 active:scale-90 disabled:opacity-40"
                  aria-label={`Increase ${ing.name}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
