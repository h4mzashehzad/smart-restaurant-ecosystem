'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import type {
  AdminIngredient,
  AdminMenuCategory,
  AdminMenuItem,
  CreateMenuItemPayload,
  MenuItemIngredientPayload,
  SpiceLevel,
  UpdateMenuItemPayload,
} from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const SPICE_OPTIONS: { value: SpiceLevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'hot', label: 'Hot' },
  { value: 'extra_hot', label: 'Extra hot' },
];

const SPICE_ITEMS = Object.fromEntries(SPICE_OPTIONS.map((o) => [o.value, o.label]));

export type MenuItemSavePhase = 'idle' | 'saving' | 'uploading';

interface IngredientRow {
  ingredient_id: number;
  quantity: number;
  is_optional: boolean;
  is_removable: boolean;
}

interface FormState {
  category_id: string;
  name: string;
  description: string;
  base_price: string;
  preparation_time: string;
  spice_level: SpiceLevel;
  cuisine_type: string;
  calories: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_signature: boolean;
  is_available: boolean;
  ingredients: IngredientRow[];
}

const EMPTY_FORM: FormState = {
  category_id: '',
  name: '',
  description: '',
  base_price: '',
  preparation_time: '15',
  spice_level: 'none',
  cuisine_type: '',
  calories: '',
  is_vegetarian: false,
  is_vegan: false,
  is_gluten_free: false,
  is_signature: false,
  is_available: true,
  ingredients: [],
};

function itemToForm(item: AdminMenuItem): FormState {
  return {
    category_id: String(item.category_id),
    name: item.name,
    description: item.description ?? '',
    base_price: String(item.base_price ?? ''),
    preparation_time: String(item.preparation_time ?? 15),
    spice_level: item.spice_level ?? 'none',
    cuisine_type: item.cuisine_type ?? '',
    calories: item.calories != null ? String(item.calories) : '',
    is_vegetarian: Boolean(item.is_vegetarian),
    is_vegan: Boolean(item.is_vegan),
    is_gluten_free: Boolean(item.is_gluten_free),
    is_signature: Boolean(item.is_signature),
    is_available: Boolean(item.is_available),
    ingredients: (item.ingredients ?? []).map((ing) => ({
      ingredient_id: ing.id,
      quantity: Number(ing.pivot?.quantity ?? 1),
      is_optional: Boolean(ing.pivot?.is_optional),
      is_removable: ing.pivot?.is_removable !== false,
    })),
  };
}

interface MenuItemEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AdminMenuItem | null;
  categories: AdminMenuCategory[];
  ingredientsCatalog: AdminIngredient[];
  savePhase?: MenuItemSavePhase;
  error?: string;
  onSave: (args: {
    payload: CreateMenuItemPayload | UpdateMenuItemPayload;
    imageFile: File | null;
  }) => void;
  /** Called when parent finishes a successful image upload so preview can refresh. */
  uploadedImageUrl?: string | null;
}

export function MenuItemEditModal({
  open,
  onOpenChange,
  item,
  categories,
  ingredientsCatalog,
  savePhase = 'idle',
  error,
  onSave,
  uploadedImageUrl,
}: MenuItemEditModalProps) {
  const isCreate = item === null;
  const saving = savePhase !== 'idle';
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploadSucceeded, setImageUploadSucceeded] = useState(false);
  const [addIngredientId, setAddIngredientId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(item ? itemToForm(item) : EMPTY_FORM);
    setImageFile(null);
    setImagePreview(item?.image_url ?? null);
    setImageUploadSucceeded(false);
    setAddIngredientId(null);
  }, [open, item]);

  useEffect(() => {
    if (!uploadedImageUrl) return;
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(uploadedImageUrl);
    setImageFile(null);
    setImageUploadSucceeded(true);
  }, [uploadedImageUrl]); // eslint-disable-line react-hooks/exhaustive-deps -- only react to upload completion

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const categoryItems = useMemo(
    () => Object.fromEntries(categories.map((c) => [String(c.id), c.name])),
    [categories]
  );

  const availableToAdd = useMemo(() => {
    const used = new Set(form.ingredients.map((row) => row.ingredient_id));
    return ingredientsCatalog.filter((ing) => !used.has(ing.id));
  }, [form.ingredients, ingredientsCatalog]);

  const ingredientItems = useMemo(
    () =>
      Object.fromEntries(
        availableToAdd.map((ing) => [
          String(ing.id),
          ing.unit ? `${ing.name} (${ing.unit})` : ing.name,
        ])
      ),
    [availableToAdd]
  );

  const ingredientNameById = useMemo(() => {
    const map = new Map<number, AdminIngredient>();
    for (const ing of ingredientsCatalog) map.set(ing.id, ing);
    return map;
  }, [ingredientsCatalog]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(file: File | null) {
    if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImageUploadSucceeded(false);
    setImagePreview(file ? URL.createObjectURL(file) : item?.image_url ?? null);
  }

  function addIngredient() {
    if (!addIngredientId) return;
    const id = Number(addIngredientId);
    if (!id) return;
    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { ingredient_id: id, quantity: 1, is_optional: false, is_removable: true },
      ],
    }));
    setAddIngredientId(null);
  }

  function updateIngredient(ingredientId: number, patch: Partial<IngredientRow>) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((row) =>
        row.ingredient_id === ingredientId ? { ...row, ...patch } : row
      ),
    }));
  }

  function removeIngredient(ingredientId: number) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((row) => row.ingredient_id !== ingredientId),
    }));
  }

  function buildIngredientsPayload(): MenuItemIngredientPayload[] {
    return form.ingredients.map((row) => ({
      ingredient_id: row.ingredient_id,
      quantity: Number(row.quantity),
      is_optional: row.is_optional,
      is_removable: row.is_removable,
    }));
  }

  function handleSubmit() {
    if (!form.category_id || !form.name.trim() || form.base_price === '') return;

    const payload: CreateMenuItemPayload = {
      category_id: Number(form.category_id),
      name: form.name.trim(),
      description: form.description.trim() || null,
      base_price: Number(form.base_price),
      preparation_time: form.preparation_time === '' ? 15 : Number(form.preparation_time),
      spice_level: form.spice_level,
      cuisine_type: form.cuisine_type.trim() || null,
      calories: form.calories === '' ? null : Number(form.calories),
      is_vegetarian: form.is_vegetarian,
      is_vegan: form.is_vegan,
      is_gluten_free: form.is_gluten_free,
      is_signature: form.is_signature,
      is_available: form.is_available,
      ingredients: buildIngredientsPayload(),
    };

    onSave({ payload, imageFile });
  }

  const canSave =
    Boolean(form.category_id) && form.name.trim().length > 0 && form.base_price !== '' && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-gray-100 px-5 py-4 pr-12">
          <DialogTitle>{isCreate ? 'Add menu item' : 'Edit menu item'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Category</Label>
              <Select
                value={form.category_id || null}
                onValueChange={(value) => updateField('category_id', value ?? '')}
                items={categoryItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category">
                    {(value: string | null) =>
                      value ? (categoryItems[value] ?? value) : 'Select category'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Image</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 sm:w-40">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Menu item"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                  {savePhase === 'uploading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/45 text-white">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-[11px] font-medium">Uploading…</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    disabled={saving}
                    onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-gray-500">JPG, PNG, WebP or GIF up to 5MB.</p>

                  {savePhase === 'uploading' && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-orange-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading image…
                    </p>
                  )}
                  {imageUploadSucceeded && savePhase === 'idle' && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Image uploaded successfully
                    </p>
                  )}
                  {imageFile && savePhase === 'idle' && !imageUploadSucceeded && (
                    <p className="text-xs font-medium text-gray-600">
                      New image selected — will upload when you save
                    </p>
                  )}
                  {imageFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-500"
                      disabled={saving}
                      onClick={() => handleImageChange(null)}
                    >
                      Clear new image
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="menu-name">Name</Label>
              <Input
                id="menu-name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Butter Chicken"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="menu-description">Description</Label>
              <Textarea
                id="menu-description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                placeholder="Short description for the customer menu"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-price">Price (PKR)</Label>
              <Input
                id="menu-price"
                type="number"
                min={0}
                step="0.01"
                value={form.base_price}
                onChange={(e) => updateField('base_price', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-prep">Preparation time (min)</Label>
              <Input
                id="menu-prep"
                type="number"
                min={0}
                value={form.preparation_time}
                onChange={(e) => updateField('preparation_time', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Spice level</Label>
              <Select
                value={form.spice_level}
                onValueChange={(value) =>
                  updateField('spice_level', (value as SpiceLevel) || 'none')
                }
                items={SPICE_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Spice level">
                    {(value: string | null) =>
                      value ? (SPICE_ITEMS[value] ?? value) : 'Spice level'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SPICE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-cuisine">Cuisine type</Label>
              <Input
                id="menu-cuisine"
                value={form.cuisine_type}
                onChange={(e) => updateField('cuisine_type', e.target.value)}
                placeholder="e.g. Pakistani"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="menu-calories">Calories</Label>
              <Input
                id="menu-calories"
                type="number"
                min={0}
                value={form.calories}
                onChange={(e) => updateField('calories', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
              <Label htmlFor="menu-available" className="cursor-pointer">
                Available
              </Label>
              <Switch
                id="menu-available"
                checked={form.is_available}
                onCheckedChange={(checked) => updateField('is_available', checked)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['is_vegetarian', 'Vegetarian'],
                ['is_vegan', 'Vegan'],
                ['is_gluten_free', 'Gluten-free'],
                ['is_signature', 'Signature'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-gray-100 px-3 py-2.5"
              >
                <Checkbox
                  checked={form[key]}
                  onCheckedChange={(checked) => updateField(key, Boolean(checked))}
                />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-100 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Ingredients</p>
              <p className="text-xs text-gray-500">
                Choose from your restaurant&apos;s ingredient list. Set quantity, optional, and
                removable.
              </p>
            </div>

            {form.ingredients.length === 0 ? (
              <p className="rounded-xl bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
                No ingredients linked yet.
              </p>
            ) : (
              <div className="space-y-2">
                {form.ingredients.map((row) => {
                  const meta = ingredientNameById.get(row.ingredient_id);
                  return (
                    <div
                      key={row.ingredient_id}
                      className="grid gap-2 rounded-xl border border-gray-100 bg-white p-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {meta?.name ?? `Ingredient #${row.ingredient_id}`}
                        </p>
                        {meta?.unit && (
                          <p className="text-[11px] text-gray-400">Unit: {meta.unit}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Label className="sr-only">Quantity</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="h-8 w-24"
                          value={row.quantity}
                          onChange={(e) =>
                            updateIngredient(row.ingredient_id, {
                              quantity: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Checkbox
                          checked={row.is_optional}
                          onCheckedChange={(checked) =>
                            updateIngredient(row.ingredient_id, {
                              is_optional: Boolean(checked),
                            })
                          }
                        />
                        Optional
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Checkbox
                          checked={row.is_removable}
                          onCheckedChange={(checked) =>
                            updateIngredient(row.ingredient_id, {
                              is_removable: Boolean(checked),
                            })
                          }
                        />
                        Removable
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeIngredient(row.ingredient_id)}
                        aria-label="Remove ingredient"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={addIngredientId}
                onValueChange={(value) => setAddIngredientId(value)}
                items={ingredientItems}
              >
                <SelectTrigger className="w-full flex-1">
                  <SelectValue placeholder="Add ingredient…">
                    {(value: string | null) =>
                      value ? (ingredientItems[value] ?? value) : 'Add ingredient…'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No more ingredients available
                    </SelectItem>
                  ) : (
                    availableToAdd.map((ing) => (
                      <SelectItem key={ing.id} value={String(ing.id)}>
                        {ing.name}
                        {ing.unit ? ` (${ing.unit})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                disabled={!addIngredientId || addIngredientId === '__none'}
                onClick={addIngredient}
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 shrink-0 gap-3 border-t px-5 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-w-24 px-4"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            className="min-w-32 bg-orange-500 px-4 text-white hover:bg-orange-600"
            disabled={!canSave}
            onClick={handleSubmit}
          >
            {savePhase === 'uploading'
              ? 'Uploading image…'
              : savePhase === 'saving'
                ? 'Saving…'
                : isCreate
                  ? 'Create item'
                  : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
