'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { getErrorMessage } from '@/lib/error-message';
import type { AdminMenuCategory, CreateCategoryPayload } from '@/types/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CategoryForm {
  name: string;
  description: string;
  display_order: string;
  is_active: boolean;
}

const EMPTY_FORM: CategoryForm = {
  name: '',
  description: '',
  display_order: '0',
  is_active: true,
};

function toForm(category: AdminMenuCategory): CategoryForm {
  return {
    name: category.name,
    description: category.description ?? '',
    display_order: String(category.display_order ?? 0),
    is_active: Boolean(category.is_active),
  };
}

function toPayload(form: CategoryForm): CreateCategoryPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    display_order: form.display_order === '' ? 0 : Number(form.display_order),
    is_active: form.is_active,
  };
}

export default function CategoriesContainer() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminMenuCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminMenuCategory | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: adminApi.getCategories,
  });

  const categories = [...(data ?? [])].sort(
    (a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)
  );

  useEffect(() => {
    if (!formOpen) return;
    setForm(editing ? toForm(editing) : EMPTY_FORM);
    setFormError('');
  }, [formOpen, editing]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = toPayload(form);
      if (editing) {
        return adminApi.updateCategory(editing.id, payload);
      }
      return adminApi.createCategory(payload);
    },
    onSuccess: () => {
      invalidate();
      setFormOpen(false);
      setEditing(null);
      setFormError('');
    },
    onError: (err) => setFormError(getErrorMessage(err, 'Failed to save category.')),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: (result) => {
      invalidate();
      setDeleteMessage(result.message);
      setDeleteError('');
      if (!result.data) {
        setDeleteOpen(false);
        setDeleting(null);
        setDeleteMessage('');
      }
    },
    onError: (err) => setDeleteError(getErrorMessage(err, 'Failed to remove category.')),
  });

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: AdminMenuCategory) {
    setEditing(category);
    setFormOpen(true);
  }

  function openDelete(category: AdminMenuCategory) {
    setDeleting(category);
    setDeleteMessage('');
    setDeleteError('');
    setDeleteOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize your menu into categories. Control order and visibility for guests."
        actions={
          <Button
            size="sm"
            className="bg-orange-500 text-white hover:bg-orange-600"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load categories." />
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No categories yet"
          description="Create categories like Starters, Mains, or Drinks so you can organize menu items."
          action={
            <Button
              size="sm"
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {categories.map((category) => {
            const itemCount = category.menu_items?.length ?? 0;
            return (
              <Card
                key={category.id}
                className={`border-gray-200 transition-opacity ${!category.is_active ? 'opacity-70' : ''}`}
              >
                <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-gray-900">
                        {category.name}
                      </h3>
                      <StatusBadge status={category.is_active ? 'active' : 'inactive'} />
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                        Order {category.display_order}
                      </span>
                    </div>
                    {category.description ? (
                      <p className="line-clamp-2 text-sm text-gray-500">{category.description}</p>
                    ) : (
                      <p className="text-sm text-gray-400">No description</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {itemCount} menu item{itemCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-gray-200"
                      onClick={() => openEdit(category)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => openDelete(category)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit category' : 'Add category'}</DialogTitle>
          </DialogHeader>
          {formError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Starters"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional short description"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-order">Display order</Label>
              <Input
                id="category-order"
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Lower numbers appear first on the menu.</p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
              <Label htmlFor="category-active" className="cursor-pointer">
                Active
              </Label>
              <Switch
                id="category-active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
              />
            </div>
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
              {save.isPending ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleting(null);
            setDeleteMessage('');
            setDeleteError('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteMessage ? 'Done' : `Remove ${deleting?.name ?? 'category'}?`}
            </DialogTitle>
          </DialogHeader>
          {deleteError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
          )}
          {deleteMessage ? (
            <p className="text-sm text-gray-600">{deleteMessage}</p>
          ) : (
            <p className="text-sm text-gray-600">
              If this category still has menu items, it will be archived (deactivated) instead of
              permanently deleted.
            </p>
          )}
          <DialogFooter className="gap-3">
            {deleteMessage ? (
              <Button
                size="lg"
                className="px-4"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleting(null);
                  setDeleteMessage('');
                }}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-4"
                  onClick={() => setDeleteOpen(false)}
                  disabled={remove.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  className="bg-red-600 px-4 text-white hover:bg-red-700"
                  disabled={!deleting || remove.isPending}
                  onClick={() => deleting && remove.mutate(deleting.id)}
                >
                  {remove.isPending ? 'Removing…' : 'Remove'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
