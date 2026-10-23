'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Banknote, CheckCircle2, Receipt } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { DeferredFeatureNotice } from '@/components/admin/DeferredFeatureNotice';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminPayment } from '@/types/admin';

interface CashPaymentEntry {
  id: number;
  amount: number | string;
  order?: {
    order_number?: string;
    table?: { table_number?: string } | null;
  } | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentsContainer() {
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['admin', 'payments', 'cash-pending'],
    queryFn: () => adminApi.getPendingCashPayments(),
  });

  const ledgerQuery = useQuery({
    queryKey: ['admin', 'payments', 'ledger'],
    queryFn: () => adminApi.getPayments({ page: 1 }),
  });

  const confirm = useMutation({
    mutationFn: (paymentId: number) => adminApi.confirmCashPayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
    },
  });

  const pending = pendingQuery.data ?? [];
  const ledgerPages = ledgerQuery.data;
  const ledger = (ledgerPages?.data ?? []) as AdminPayment[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        description="Confirm pending cash payments and review the restaurant payment ledger."
      />

      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gray-500">
          Pending cash
        </h2>
        {pendingQuery.isError ? (
          <ErrorState
            onRetry={() => pendingQuery.refetch()}
            description="Couldn't load pending cash payments."
          />
        ) : pendingQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No pending cash payments"
            description="Cash payments awaiting confirmation will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(pending as CashPaymentEntry[]).map((payment) => (
              <Card key={payment.id} className="border-gray-200">
                <CardContent className="space-y-3 py-1">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                      <Banknote className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {payment.order?.order_number ?? `Payment #${payment.id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Table {payment.order?.table?.table_number ?? '—'}
                      </p>
                    </div>
                  </div>
                  <p className="font-display text-xl font-bold text-gray-900">
                    {formatCurrency(Number(payment.amount))}
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={confirm.isPending}
                    onClick={() => confirm.mutate(payment.id)}
                  >
                    Confirm cash received
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gray-500">
          Recent ledger
        </h2>
        {ledgerQuery.isError ? (
          <ErrorState
            onRetry={() => ledgerQuery.refetch()}
            description="Couldn't load the payment ledger."
          />
        ) : ledgerQuery.isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : ledger.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments yet"
            description="Completed and pending payments for this restaurant will show here."
          />
        ) : (
          <Card className="border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Refund / fee</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">#{payment.id}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method}</TableCell>
                    <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell className="text-xs">{payment.refunds?.map(r => <div key={r.id}>Rs {(r.amount_paisa / 100).toFixed(2)} · {r.status.replaceAll('_', ' ')}<br />Fee Rs {(r.fee_paisa / 100).toFixed(2)}</div>) ?? '—'}</TableCell>
                    <TableCell>{payment.order?.order_number ?? payment.order_id}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      <DeferredFeatureNotice
        title="Refunds & settlement deferred"
        description="Reservation cancellations and refunds are managed under Reservations. General refunds, disputes, and settlement exports are not enabled here."
        todoSection="10. Payment refunds & reconciliation"
      />
    </div>
  );
}
