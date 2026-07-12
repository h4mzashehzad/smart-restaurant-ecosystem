'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table2, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { getErrorMessage } from '@/lib/error-message';
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
  DialogTrigger,
} from '@/components/ui/dialog';

const EMPTY_FORM = { table_number: '', capacity: 2 };

export default function TablesContainer() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'tables'],
    queryFn: adminApi.getTables,
  });

  const create = useMutation({
    mutationFn: () => adminApi.createTable(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tables'] });
      setOpen(false);
      setForm(EMPTY_FORM);
      setError('');
    },
    onError: (err) => setError(getErrorMessage(err, 'Failed to add table.')),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.deleteTable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tables'] }),
  });

  const tables = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tables"
        description="Configure dine-in tables and their QR codes."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4" />
              Add table
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add table</DialogTitle>
              </DialogHeader>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="table_number">Table number</Label>
                  <Input
                    id="table_number"
                    value={form.table_number}
                    onChange={(e) => setForm((f) => ({ ...f, table_number: e.target.value }))}
                    placeholder="e.g. T1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={create.isPending || !form.table_number}
                  onClick={() => create.mutate()}
                >
                  {create.isPending ? 'Adding...' : 'Add table'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load tables." />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="No tables configured"
          description="Add your restaurant's tables so guests can scan and order."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tables.map((table) => (
            <Card key={table.id} className="border-gray-200">
              <CardContent className="flex flex-col gap-2 py-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-bold text-gray-900">{table.table_number}</p>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-red-600"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(table.id)}
                    aria-label="Remove table"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Seats {table.capacity}</p>
                <StatusBadge status={table.status} className="w-fit" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
