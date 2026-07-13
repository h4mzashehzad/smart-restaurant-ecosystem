'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Carrot, Pencil, Plus, Search } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { getErrorMessage } from '@/lib/error-message';
import type { AdminIngredient, CreateIngredientPayload } from '@/types/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface IngredientForm {
  name: string;
  unit: string;
  cost_per_unit: string;
  stock_quantity: string;
  minimum_threshold: string;
  is_allergen: boolean;
  allergen_type: string;
}

const EMPTY_FORM: IngredientForm = {
  name: '',
  unit: 'piece',
  cost_per_unit: '0',
  stock_quantity: '0',
  minimum_threshold: '0',
  is_allergen: false,
  allergen_type: '',
};

const UNIT_SUGGESTIONS = ['piece', 'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pinch'];

function toForm(ingredient: AdminIngredient): IngredientForm {
  return {
    name: ingredient.name,
    unit: ingredient.unit || 'piece',
    cost_per_unit: String(ingredient.cost_per_unit ?? 0),
    stock_quantity: String(ingredient.stock_quantity ?? 0),
    minimum_threshold: String(ingredient.minimum_threshold ?? 0),
    is_allergen: Boolean(ingredient.is_allergen),
    allergen_type: ingredient.allergen_type ?? '',
  };
}

function toPayload(form: IngredientForm): CreateIngredientPayload {
  return {
    name: form.name.trim(),
    unit: form.unit.trim() || 'piece',
    cost_per_unit: form.cost_per_unit === '' ? 0 : Number(form.cost_per_unit),
    stock_quantity: form.stock_quantity === '' ? 0 : Number(form.stock_quantity),
    minimum_threshold: form.minimum_threshold === '' ? 0 : Number(form.minimum_threshold),
    is_allergen: form.is_allergen,
    allergen_type: form.is_allergen ? form.allergen_type.trim() || null : null,
  };
}

function isLowStock(ingredient: AdminIngredient) {
  return Number(ingredient.stock_quantity) <= Number(ingredient.minimum_threshold);
}

function formatNumber(value: number) {
  return Number(value).toLocaleString('en-PK', { maximumFractionDigits: 2 });
}

export default function IngredientsContainer() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminIngredient | null>(null);
  const [form, setForm] = useState<IngredientForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'ingredients'],
    queryFn: adminApi.getIngredients,
  });

  const ingredients = data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter(
      (ing) =>
        ing.name.toLowerCase().includes(q) ||
        ing.unit.toLowerCase().includes(q) ||
        (ing.allergen_type ?? '').toLowerCase().includes(q)
    );
  }, [ingredients, search]);

  const lowStockCount = ingredients.filter(isLowStock).length;

  useEffect(() => {
    if (!formOpen) return;
    setForm(editing ? toForm(editing) : EMPTY_FORM);
    setFormError('');
  }, [formOpen, editing]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'ingredients'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = toPayload(form);
      if (editing) {
        return adminApi.updateIngredient(editing.id, payload);
      }
      return adminApi.createIngredient(payload);
    },
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setEditing(null);
      setFormError('');
    },
    onError: (err) => setFormError(getErrorMessage(err, 'Failed to save ingredient.')),
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(ingredient: AdminIngredient) {
    setEditing(ingredient);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingredients"
        description="Track stock, cost, and allergens for every ingredient used on your menu."
        actions={
          <Button
            size="sm"
            className="bg-orange-500 text-white hover:bg-orange-600"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Add ingredient
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load ingredients." />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : ingredients.length === 0 ? (
        <EmptyState
          icon={Carrot}
          title="No ingredients yet"
          description="Add ingredients so you can attach them to menu items and track stock levels."
          action={
            <Button
              size="sm"
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              Add ingredient
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ingredients…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600">
                {ingredients.length} total
              </span>
              {lowStockCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {lowStockCount} low stock
                </span>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              description="Try a different search term."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_0.7fr_0.8fr_0.8fr_0.9fr_auto] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold tracking-wide text-gray-500 uppercase sm:grid">
                <span>Ingredient</span>
                <span>Unit</span>
                <span>Stock</span>
                <span>Min</span>
                <span>Cost / unit</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-gray-100">
                {filtered.map((ingredient) => {
                  const low = isLowStock(ingredient);
                  return (
                    <div
                      key={ingredient.id}
                      className={cn(
                        'grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1.4fr)_0.7fr_0.8fr_0.8fr_0.9fr_auto] sm:items-center sm:gap-3',
                        low && 'bg-amber-50/40'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {ingredient.name}
                          </p>
                          {ingredient.is_allergen && (
                            <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-600 uppercase">
                              Allergen
                              {ingredient.allergen_type ? ` · ${ingredient.allergen_type}` : ''}
                            </span>
                          )}
                          {low && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700 uppercase">
                              <AlertTriangle className="h-3 w-3" />
                              Low
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-400 sm:hidden">
                          {formatNumber(ingredient.stock_quantity)} {ingredient.unit} · Rs{' '}
                          {formatNumber(ingredient.cost_per_unit)}/{ingredient.unit}
                        </p>
                      </div>
                      <p className="hidden text-sm text-gray-600 sm:block">{ingredient.unit}</p>
                      <p className="hidden text-sm font-medium text-gray-900 sm:block">
                        {formatNumber(ingredient.stock_quantity)}
                      </p>
                      <p className="hidden text-sm text-gray-600 sm:block">
                        {formatNumber(ingredient.minimum_threshold)}
                      </p>
                      <p className="hidden text-sm text-gray-600 sm:block">
                        Rs {formatNumber(ingredient.cost_per_unit)}
                      </p>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-gray-200"
                          onClick={() => openEdit(ingredient)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit ingredient' : 'Add ingredient'}</DialogTitle>
          </DialogHeader>
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ingredient-name">Name</Label>
              <Input
                id="ingredient-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Chicken breast"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ingredient-unit">Unit</Label>
                <Input
                  id="ingredient-unit"
                  list="ingredient-unit-suggestions"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="g, ml, piece…"
                />
                <datalist id="ingredient-unit-suggestions">
                  {UNIT_SUGGESTIONS.map((unit) => (
                    <option key={unit} value={unit} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ingredient-cost">Cost per unit (PKR)</Label>
                <Input
                  id="ingredient-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.cost_per_unit}
                  onChange={(e) => setForm((f) => ({ ...f, cost_per_unit: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ingredient-stock">Stock quantity</Label>
                <Input
                  id="ingredient-stock"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.stock_quantity}
                  onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ingredient-threshold">Minimum threshold</Label>
                <Input
                  id="ingredient-threshold"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minimum_threshold}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minimum_threshold: e.target.value }))
                  }
                />
              </div>
            </div>

            <Card className="border-gray-100 shadow-none">
              <CardContent className="space-y-3 py-3">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <Checkbox
                    checked={form.is_allergen}
                    onCheckedChange={(checked) =>
                      setForm((f) => ({
                        ...f,
                        is_allergen: Boolean(checked),
                        allergen_type: checked ? f.allergen_type : '',
                      }))
                    }
                  />
                  <span className="text-sm font-medium text-gray-700">This is an allergen</span>
                </label>
                {form.is_allergen && (
                  <div className="space-y-1.5">
                    <Label htmlFor="allergen-type">Allergen type</Label>
                    <Input
                      id="allergen-type"
                      value={form.allergen_type}
                      onChange={(e) => setForm((f) => ({ ...f, allergen_type: e.target.value }))}
                      placeholder="e.g. Dairy, Nuts, Gluten"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="px-4"
              onClick={() => setFormOpen(false)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              className="bg-orange-500 px-4 text-white hover:bg-orange-600"
              disabled={!form.name.trim() || save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create ingredient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
