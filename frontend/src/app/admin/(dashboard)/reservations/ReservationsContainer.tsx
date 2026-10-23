'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReservationActions } from '@/components/admin/ReservationActions';
import { ReservationPreorderDetails } from '@/components/admin/ReservationPreorderDetails';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReservationsContainer() {
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }));
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'reservations', date],
    queryFn: () => adminApi.getReservations({ date }),
    refetchInterval: 15000,
  });

  const reservations = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations"
        description="Manage upcoming table bookings."
        actions={
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load reservations." />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No reservations for this date"
          description="Bookings made by guests for this date will appear here."
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Food preorder</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{r.guest_name}</div>
                    <div className="text-xs text-gray-500">{r.guest_phone}</div>
                  </TableCell>
                  <TableCell>{r.party_size}</TableCell>
                  <TableCell>{r.reservation_time}</TableCell>
                  <TableCell>{r.table?.table_number ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell><ReservationPreorderDetails preorder={r.preorder} refunds={r.refunds} timezone={r.restaurant?.timezone} onUpdated={() => { void refetch(); }} /></TableCell>
                  <TableCell className="text-right">
                    <ReservationActions reservation={r} onUpdated={() => { void queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] }); }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
