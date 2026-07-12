'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UtensilsCrossed } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function MenuContainer() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'menu'],
    queryFn: adminApi.getMenu,
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, is_available }: { id: number; is_available: boolean }) =>
      adminApi.updateMenuItem(id, { is_available }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'menu'] }),
  });

  const categories = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Menu" description="Toggle availability for menu items in real time." />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load the menu." />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No menu items yet"
          description="Your restaurant's categories and items will show up here."
        />
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                {category.name}
              </p>
              <div className="space-y-2">
                {(category.menu_items ?? []).map((item) => (
                  <Card key={item.id} className="border-gray-200">
                    <CardContent className="flex items-center justify-between gap-3 py-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.base_price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                        <Switch
                          checked={item.is_available}
                          onCheckedChange={(checked) =>
                            toggleAvailability.mutate({ id: item.id, is_available: checked })
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
