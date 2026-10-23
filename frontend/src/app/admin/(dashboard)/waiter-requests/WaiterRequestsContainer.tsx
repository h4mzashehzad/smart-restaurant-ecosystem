'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  waiter_call: 'Waiter Call',
  extra_naan_roti: 'Extra Naan/Roti',
  extra_raita_salad: 'Extra Raita/Salad',
  bill_request: 'Bill Request',
  water_refill: 'Water Refill',
  cutlery: 'Cutlery',
  complaint: 'Complaint',
  other: 'Other',
};

export default function WaiterRequestsContainer() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'waiter-requests'],
    queryFn: () => adminApi.getWaiterRequests(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'waiter-requests'] });

  const acknowledge = useMutation({
    mutationFn: (id: number) => adminApi.acknowledgeWaiterRequest(id),
    onSuccess: invalidate,
  });

  const resolve = useMutation({
    mutationFn: (id: number) => adminApi.resolveWaiterRequest(id),
    onSuccess: invalidate,
  });

  const requests = (data ?? []).filter((r) => r.status !== 'resolved' && r.status !== 'cancelled');

  return (
    <div className="space-y-6">
      <PageHeader title="Waiter Requests" description="Assistance requests from tables." />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load waiter requests." />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up"
          description="No pending waiter requests right now."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((req) => (
            <Card key={req.id} className="border-gray-200">
              <CardContent className="space-y-3 py-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                      <BellRing className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {REQUEST_TYPE_LABELS[req.request_type] ?? req.request_type}
                      </p>
                      <p className="text-xs text-gray-500">
                        Table {req.table?.table_number ?? '—'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={req.priority} />
                </div>

                {req.message && <p className="text-sm text-gray-600">{req.message}</p>}

                <div className="flex gap-2">
                  {req.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={acknowledge.isPending}
                      onClick={() => acknowledge.mutate(req.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={resolve.isPending}
                    onClick={() => resolve.mutate(req.id)}
                  >
                    Resolve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
