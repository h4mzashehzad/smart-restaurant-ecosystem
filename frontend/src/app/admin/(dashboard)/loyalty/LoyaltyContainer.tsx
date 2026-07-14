'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Search, Users, Award, Coins } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AdminLoyaltyCustomer, LoyaltyTier } from '@/types/admin';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function tierBadgeClass(tier: string) {
  switch (tier) {
    case 'gold':
      return 'bg-yellow-100 text-yellow-800';
    case 'silver':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-amber-100 text-amber-800';
  }
}

function typeBadgeClass(type: string) {
  switch (type) {
    case 'earned':
      return 'bg-emerald-50 text-emerald-700';
    case 'adjusted':
      return 'bg-amber-50 text-amber-700';
    case 'redeemed':
      return 'bg-orange-50 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export default function LoyaltyContainer() {
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<LoyaltyTier | ''>('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(1);

  const summaryQuery = useQuery({
    queryKey: ['admin', 'loyalty', 'summary'],
    queryFn: () => adminApi.getLoyaltySummary(),
  });

  const customersQuery = useQuery({
    queryKey: ['admin', 'loyalty', 'customers', search, tier, page],
    queryFn: () =>
      adminApi.getLoyaltyCustomers({
        search: search || undefined,
        tier: tier || undefined,
        page,
        per_page: 20,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'loyalty', 'customer', selectedId, historyPage],
    queryFn: () => adminApi.getLoyaltyCustomer(selectedId!, { page: historyPage, per_page: 15 }),
    enabled: selectedId != null,
  });

  const customers = customersQuery.data?.data ?? [];
  const lastPage = customersQuery.data?.last_page ?? 1;
  const summary = summaryQuery.data;

  const selectedCustomer = useMemo(
    () => detailQuery.data?.customer ?? customers.find((c) => c.id === selectedId) ?? null,
    [detailQuery.data?.customer, customers, selectedId]
  );

  const transactions = detailQuery.data?.transactions?.data ?? [];
  const historyLastPage = detailQuery.data?.transactions?.last_page ?? 1;

  function openCustomer(customer: AdminLoyaltyCustomer) {
    setSelectedId(customer.id);
    setHistoryPage(1);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Loyalty Program"
        description="View active loyalty customers, tiers, points balances, and transaction history."
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Loyalty customers"
          value={summary?.total_customers ?? '—'}
          icon={Users}
          accent="orange"
          loading={summaryQuery.isLoading}
        />
        <StatCard
          label="Bronze"
          value={summary?.bronze_count ?? '—'}
          icon={Award}
          accent="amber"
          loading={summaryQuery.isLoading}
        />
        <StatCard
          label="Silver / Gold"
          value={
            summary
              ? `${summary.silver_count} / ${summary.gold_count}`
              : '—'
          }
          icon={Gift}
          accent="violet"
          loading={summaryQuery.isLoading}
        />
        <StatCard
          label="Points issued"
          value={summary ? summary.total_points_issued.toLocaleString() : '—'}
          icon={Coins}
          accent="emerald"
          loading={summaryQuery.isLoading}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-gray-500">
            Customers
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, phone…"
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <select
              value={tier}
              onChange={(e) => {
                setTier(e.target.value as LoyaltyTier | '');
                setPage(1);
              }}
              className="h-10 appearance-none rounded-xl border border-gray-200 bg-white bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pl-3 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E\")",
              }}
            >
              <option value="">All tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>
        </div>

        {customersQuery.isError ? (
          <ErrorState
            onRetry={() => customersQuery.refetch()}
            description="Couldn't load loyalty customers."
          />
        ) : customersQuery.isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="No loyalty customers yet"
            description="Customers who place orders while signed in will appear here with their points and tier."
          />
        ) : (
          <Card className="border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Last order</TableHead>
                  <TableHead className="text-right">History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer" onClick={() => openCustomer(customer)}>
                    <TableCell className="font-medium text-gray-900">{customer.name}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-xs text-gray-400">{customer.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${tierBadgeClass(customer.loyalty_tier)}`}
                      >
                        {customer.loyalty_tier}
                      </span>
                    </TableCell>
                    <TableCell className="font-display font-semibold">
                      {customer.loyalty_points.toLocaleString()}
                    </TableCell>
                    <TableCell>{customer.restaurant_order_count ?? 0}</TableCell>
                    <TableCell>
                      {formatCurrency(Number(customer.restaurant_total_spend ?? 0))}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {customer.last_order_at
                        ? new Date(customer.last_order_at).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomer(customer);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-gray-500 font-sans">
              Page {page} of {lastPage}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </section>

      <Dialog
        open={selectedId != null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setHistoryPage(1);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedCustomer?.name ?? 'Customer'} — points history
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-sans text-gray-500">{selectedCustomer.email}</p>
                  <span
                    className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${tierBadgeClass(selectedCustomer.loyalty_tier)}`}
                  >
                    {selectedCustomer.loyalty_tier}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                    Points
                  </p>
                  <p className="font-display text-2xl font-bold text-gray-900">
                    {selectedCustomer.loyalty_points.toLocaleString()}
                  </p>
                </div>
              </div>

              {detailQuery.isError ? (
                <ErrorState
                  onRetry={() => detailQuery.refetch()}
                  description="Couldn't load points history."
                />
              ) : detailQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon={Coins}
                  title="No transactions"
                  description="This customer has not earned or adjusted points yet."
                />
              ) : (
                <ul className="space-y-2">
                  {transactions.map((tx) => (
                    <li
                      key={tx.id}
                      className="rounded-xl border border-gray-100 px-3.5 py-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeBadgeClass(tx.transaction_type)}`}
                          >
                            {tx.transaction_type}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">
                          {tx.description || 'Loyalty update'}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Balance · {tx.balance_after.toLocaleString()} pts
                          {tx.order?.order_number ? ` · ${tx.order.order_number}` : ''}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-display font-bold text-sm ${
                          tx.points >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {tx.points >= 0 ? '+' : ''}
                        {tx.points.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {historyLastPage > 1 && (
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-gray-500">
                    {historyPage} / {historyLastPage}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={historyPage >= historyLastPage}
                    onClick={() => setHistoryPage((p) => Math.min(historyLastPage, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
