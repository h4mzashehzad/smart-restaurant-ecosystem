'use client';

import QRCode from 'react-qr-code';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  ExternalLink,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Table2,
  Trash2,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { getErrorMessage } from '@/lib/error-message';
import type { RestaurantTable } from '@/types/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const EMPTY_FORM = { table_number: '', capacity: 4 };

function sortTablesNaturally(tables: RestaurantTable[]) {
  return [...tables].sort((a, b) =>
    a.table_number.localeCompare(b.table_number, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  );
}

function sessionLinkFor(table: RestaurantTable) {
  if (!table.qr_code) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/scan/${table.qr_code}`;
}

async function downloadQrImage(table: RestaurantTable) {
  if (!table.qr_code) {
    throw new Error('No QR code token available for this table.');
  }

  await adminApi.downloadTableQr(table.id, table.table_number);
}

export default function TablesContainer() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState('');
  const [createWarning, setCreateWarning] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RestaurantTable | null>(null);
  const [editCapacity, setEditCapacity] = useState(2);
  const [editError, setEditError] = useState('');

  const [qrOpen, setQrOpen] = useState(false);
  const [qrTable, setQrTable] = useState<RestaurantTable | null>(null);
  const [qrError, setQrError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<RestaurantTable | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'tables'],
    queryFn: adminApi.getTables,
  });

  const tables = useMemo(() => sortTablesNaturally(data ?? []), [data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'tables'] });

  const create = useMutation({
    mutationFn: () => adminApi.createTable(createForm),
    onSuccess: (table) => {
      invalidate();
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      setCreateError('');
      if (!table.qr_code_url) {
        setCreateWarning(
          `Table ${table.table_number} is ready. Its QR code can be previewed and downloaded here even when cloud storage is unavailable.`
        );
      } else {
        setCreateWarning('');
      }
    },
    onError: (err) => setCreateError(getErrorMessage(err, 'Failed to add table.')),
  });

  const update = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('No table selected');
      return adminApi.updateTable(editing.id, { capacity: editCapacity });
    },
    onSuccess: () => {
      invalidate();
      setEditOpen(false);
      setEditing(null);
      setEditError('');
    },
    onError: (err) => setEditError(getErrorMessage(err, 'Failed to update capacity.')),
  });

  const regenerate = useMutation({
    mutationFn: (id: number) => adminApi.regenerateTableQr(id),
    onSuccess: (table) => {
      invalidate();
      setQrTable(table);
      setQrError('');
    },
    onError: (err) => setQrError(getErrorMessage(err, 'Failed to regenerate QR code.')),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteTable(id),
    onSuccess: () => {
      invalidate();
      setDeleteOpen(false);
      setDeleting(null);
      setDeleteError('');
    },
    onError: (err) => setDeleteError(getErrorMessage(err, 'Failed to delete table.')),
  });

  function openEdit(table: RestaurantTable) {
    setEditing(table);
    setEditCapacity(table.capacity);
    setEditError('');
    setEditOpen(true);
  }

  function openQr(table: RestaurantTable) {
    setQrTable(table);
    setQrError('');
    setQrOpen(true);
  }

  function openDelete(table: RestaurantTable) {
    setDeleting(table);
    setDeleteError('');
    setDeleteOpen(true);
  }

  async function handleDownload() {
    if (!qrTable) return;
    setDownloading(true);
    setQrError('');
    try {
      await downloadQrImage(qrTable);
    } catch (err) {
      setQrError(getErrorMessage(err, 'Failed to download QR code.'));
    } finally {
      setDownloading(false);
    }
  }

  const activeQrTable =
    qrTable && tables.find((t) => t.id === qrTable.id)
      ? (tables.find((t) => t.id === qrTable.id) as RestaurantTable)
      : qrTable;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tables"
        description="Configure dine-in tables, seating capacity, QR codes, and guest session links."
        actions={
          <Button
            size="sm"
            className="bg-orange-500 text-white hover:bg-orange-600"
            onClick={() => {
              setCreateOpen(true);
              setCreateError('');
            }}
          >
            <Plus className="h-4 w-4" />
            Add table
          </Button>
        }
      />

      {createWarning && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {createWarning}
        </p>
      )}

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load tables." />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="No tables configured"
          description="Add your restaurant's tables so guests can scan and order."
          action={
            <Button
              size="sm"
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add table
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => {
            const link = sessionLinkFor(table);
            return (
              <Card key={table.id} className="border-gray-200 shadow-none">
                <CardContent className="flex h-full flex-col gap-3 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-2xl font-bold tracking-tight text-gray-900">
                        {table.table_number}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Seats {table.capacity}
                      </p>
                    </div>
                    <StatusBadge status={table.status} className="shrink-0" />
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-gray-200"
                      onClick={() => openEdit(table)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Capacity
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-gray-200"
                      onClick={() => openQr(table)}
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      QR code
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-gray-200"
                      disabled={!link}
                      onClick={() => link && window.open(link, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Session
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => openDelete(table)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateForm(EMPTY_FORM);
            setCreateError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add table</DialogTitle>
          </DialogHeader>
          {createError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{createError}</p>
          )}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="table_number">Table number</Label>
              <Input
                id="table_number"
                value={createForm.table_number}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, table_number: e.target.value }))
                }
                placeholder="e.g. 1 or T1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Seating capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={50}
                value={createForm.capacity}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, capacity: Number(e.target.value) || 1 }))
                }
              />
            </div>
            <p className="text-xs text-gray-500">
              A unique session QR code will be generated and stored automatically.
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="px-4"
              onClick={() => setCreateOpen(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              className="bg-orange-500 px-4 text-white hover:bg-orange-600"
              disabled={create.isPending || !createForm.table_number.trim()}
              onClick={() => create.mutate()}
            >
              {create.isPending ? 'Creating…' : 'Add table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit capacity */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit capacity — Table {editing?.table_number}</DialogTitle>
          </DialogHeader>
          {editError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{editError}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit-capacity">Seating capacity</Label>
            <Input
              id="edit-capacity"
              type="number"
              min={1}
              max={50}
              value={editCapacity}
              onChange={(e) => setEditCapacity(Number(e.target.value) || 1)}
            />
          </div>
          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="px-4"
              onClick={() => setEditOpen(false)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              className="bg-orange-500 px-4 text-white hover:bg-orange-600"
              disabled={update.isPending || editCapacity < 1}
              onClick={() => update.mutate()}
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR preview */}
      <Dialog
        open={qrOpen}
        onOpenChange={(open) => {
          setQrOpen(open);
          if (!open) {
            setQrTable(null);
            setQrError('');
          }
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <div className="space-y-4 px-5 pt-5 pb-4">
            <DialogHeader className="pr-8">
              <DialogTitle>QR code — Table {activeQrTable?.table_number}</DialogTitle>
            </DialogHeader>
            {qrError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{qrError}</p>
            )}

            {activeQrTable?.qr_code_url ? (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  {/* SVG from S3 — use img to avoid Next image domain constraints */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeQrTable.qr_code_url}
                    alt={`QR code for table ${activeQrTable.table_number}`}
                    className="h-56 w-56 object-contain"
                  />
                </div>
                {activeQrTable.qr_code && (
                  <p className="max-w-full break-all text-center text-xs text-gray-400">
                    /scan/{activeQrTable.qr_code}
                  </p>
                )}
              </div>
            ) : (
              activeQrTable?.qr_code ? <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4">
                <QRCode value={sessionLinkFor(activeQrTable)!} size={224} title={`QR code for table ${activeQrTable.table_number}`} />
                <p className="text-center text-xs text-gray-500">This QR code is ready to scan and download.</p>
              </div> : <p className="text-sm text-gray-600">No table QR token is available.</p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
            {activeQrTable && sessionLinkFor(activeQrTable) && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full justify-center px-4"
                onClick={() => {
                  const link = sessionLinkFor(activeQrTable);
                  if (link) window.open(link, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Open session link
              </Button>
            )}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full justify-center px-4"
                disabled={!activeQrTable?.qr_code || downloading}
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                {downloading ? 'Downloading…' : 'Download'}
              </Button>
              <Button
                type="button"
                size="lg"
                className="w-full justify-center bg-orange-500 px-4 text-white hover:bg-orange-600"
                disabled={!activeQrTable || regenerate.isPending}
                onClick={() => activeQrTable && regenerate.mutate(activeQrTable.id)}
              >
                <RefreshCw
                  className={`h-4 w-4 ${regenerate.isPending ? 'animate-spin' : ''}`}
                />
                {regenerate.isPending ? 'Regenerating…' : 'Regenerate QR'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleting(null);
            setDeleteError('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete table {deleting?.table_number}?</DialogTitle>
          </DialogHeader>
          {deleteError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteError}</p>
          )}
          <p className="text-sm text-gray-600">
            This permanently removes the table. Tables with an active session cannot be deleted.
          </p>
          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="px-4"
              onClick={() => setDeleteOpen(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              className="bg-red-600 px-4 text-white hover:bg-red-700"
              disabled={!deleting || remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id)}
            >
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
