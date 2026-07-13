'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { getErrorMessage } from '@/lib/error-message';
import type {
  AdminMenuItem,
  CreateMenuItemPayload,
  UpdateMenuItemPayload,
} from '@/types/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { MenuItemCard } from '@/components/admin/menu/MenuItemCard';
import {
  MenuItemEditModal,
  type MenuItemSavePhase,
} from '@/components/admin/menu/MenuItemEditModal';
import { MenuItemPreviewModal } from '@/components/admin/menu/MenuItemPreviewModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function withCacheBust(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
}

export default function MenuContainer() {
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null);
  const [editError, setEditError] = useState('');
  const [savePhase, setSavePhase] = useState<MenuItemSavePhase>('idle');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<AdminMenuItem | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AdminMenuItem | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'menu'],
    queryFn: adminApi.getMenu,
  });

  const { data: ingredientsCatalog = [] } = useQuery({
    queryKey: ['admin', 'ingredients'],
    queryFn: adminApi.getIngredients,
  });

  const categories = data ?? [];

  const invalidateMenu = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, is_available }: { id: number; is_available: boolean }) =>
      adminApi.updateMenuItem(id, { is_available }),
    onSuccess: invalidateMenu,
  });

  const saveItem = useMutation({
    mutationFn: async ({
      payload,
      imageFile,
    }: {
      payload: CreateMenuItemPayload | UpdateMenuItemPayload;
      imageFile: File | null;
    }) => {
      setSavePhase('saving');
      setUploadedImageUrl(null);

      let saved: AdminMenuItem;
      if (editingItem) {
        saved = await adminApi.updateMenuItem(editingItem.id, payload as UpdateMenuItemPayload);
      } else {
        saved = await adminApi.createMenuItem(payload as CreateMenuItemPayload);
      }

      let didUploadImage = false;
      if (imageFile) {
        setSavePhase('uploading');
        saved = await adminApi.uploadMenuItemImage(saved.id, imageFile);
        didUploadImage = true;
        if (saved.image_url) {
          setUploadedImageUrl(withCacheBust(saved.image_url));
        }
      }

      return { saved, didUploadImage };
    },
    onSuccess: async ({ didUploadImage }) => {
      setSavePhase('idle');
      await invalidateMenu();
      // Brief pause so the success indicator is visible when an image was uploaded
      window.setTimeout(
        () => {
          setEditOpen(false);
          setEditingItem(null);
          setEditError('');
          setUploadedImageUrl(null);
        },
        didUploadImage ? 700 : 0
      );
    },
    onError: (err) => {
      setSavePhase('idle');
      setEditError(getErrorMessage(err, 'Failed to save menu item.'));
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: number) => adminApi.deleteMenuItem(id),
    onSuccess: (result) => {
      invalidateMenu();
      setDeleteMessage(result.message);
      setDeleteError('');
      if (!result.data) {
        setDeleteOpen(false);
        setDeletingItem(null);
        setDeleteMessage('');
      }
    },
    onError: (err) => setDeleteError(getErrorMessage(err, 'Failed to delete menu item.')),
  });

  function openCreate() {
    setEditingItem(null);
    setEditError('');
    setUploadedImageUrl(null);
    setSavePhase('idle');
    setEditOpen(true);
  }

  function openEdit(item: AdminMenuItem) {
    setEditingItem(item);
    setEditError('');
    setUploadedImageUrl(null);
    setSavePhase('idle');
    setEditOpen(true);
  }

  function openPreview(item: AdminMenuItem) {
    setPreviewItem(item);
    setPreviewOpen(true);
  }

  function openDelete(item: AdminMenuItem) {
    setDeletingItem(item);
    setDeleteMessage('');
    setDeleteError('');
    setDeleteOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu"
        description="Manage dishes, availability, ingredients, and images for your restaurant."
        actions={
          <Button
            size="sm"
            className="bg-orange-500 text-white hover:bg-orange-600"
            onClick={openCreate}
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load the menu." />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-3xl" />
          ))}
        </div>
      ) : categories.length === 0 ||
        categories.every((c) => (c.menu_items ?? []).length === 0) ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items yet"
          description="Add your first dish to start building the restaurant menu."
          action={
            <Button
              size="sm"
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const items = category.menu_items ?? [];
            if (items.length === 0) return null;
            return (
              <section key={category.id}>
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    {category.name}
                  </p>
                  <span className="text-xs text-gray-400">
                    {items.length} item{items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      toggling={toggleAvailability.isPending}
                      onToggleAvailability={(menuItem, available) =>
                        toggleAvailability.mutate({
                          id: menuItem.id,
                          is_available: available,
                        })
                      }
                      onEdit={openEdit}
                      onPreview={openPreview}
                      onDelete={openDelete}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <MenuItemEditModal
        open={editOpen}
        onOpenChange={(open) => {
          if (savePhase !== 'idle') return;
          setEditOpen(open);
          if (!open) {
            setEditingItem(null);
            setEditError('');
            setUploadedImageUrl(null);
            setSavePhase('idle');
          }
        }}
        item={editingItem}
        categories={categories}
        ingredientsCatalog={ingredientsCatalog}
        savePhase={savePhase}
        error={editError}
        uploadedImageUrl={uploadedImageUrl}
        onSave={({ payload, imageFile }) => saveItem.mutate({ payload, imageFile })}
      />

      <MenuItemPreviewModal
        item={previewItem}
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) setPreviewItem(null);
        }}
      />

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeletingItem(null);
            setDeleteMessage('');
            setDeleteError('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteMessage ? 'Done' : `Remove ${deletingItem?.name ?? 'item'}?`}
            </DialogTitle>
          </DialogHeader>
          {deleteError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
          )}
          {deleteMessage ? (
            <p className="text-sm text-gray-600">{deleteMessage}</p>
          ) : (
            <p className="text-sm text-gray-600">
              If this dish has order history it will be archived (marked unavailable) instead of
              permanently deleted.
            </p>
          )}
          <DialogFooter>
            {deleteMessage ? (
              <Button
                onClick={() => {
                  setDeleteOpen(false);
                  setDeletingItem(null);
                  setDeleteMessage('');
                }}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleteItem.isPending}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  disabled={!deletingItem || deleteItem.isPending}
                  onClick={() => deletingItem && deleteItem.mutate(deletingItem.id)}
                >
                  {deleteItem.isPending ? 'Removing…' : 'Remove'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
