'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import type { UpdateRestaurantPayload } from '@/types/admin';
import { PageHeader } from '@/components/admin/PageHeader';
import { ErrorState } from '@/components/admin/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/admin/StatusBadge';

export default function RestaurantContainer() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateRestaurantPayload>({});
  const [loadedRestaurantId, setLoadedRestaurantId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: restaurant, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'restaurant'],
    queryFn: adminApi.getRestaurant,
  });

  // Seed the form from freshly loaded data. Adjusting state during render
  // (rather than in an effect) avoids an extra render pass.
  if (restaurant && restaurant.id !== loadedRestaurantId) {
    setLoadedRestaurantId(restaurant.id);
    setForm({
      name: restaurant.name,
      address: restaurant.address ?? '',
      phone: restaurant.phone ?? '',
      email: restaurant.email ?? '',
      opening_time: restaurant.opening_time ?? '',
      closing_time: restaurant.closing_time ?? '',
    });
  }

  const update = useMutation({
    mutationFn: () => adminApi.updateRestaurant(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} description="Couldn't load restaurant details." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Details"
        description="This information is shown to customers and used across the platform."
        actions={restaurant && <StatusBadge status={restaurant.is_active ? 'active' : 'inactive'} />}
      />

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <Card className="border-gray-200 max-w-2xl">
          <CardContent className="space-y-4 py-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Restaurant name</Label>
                <Input
                  id="name"
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div />
              <div className="space-y-1.5">
                <Label htmlFor="opening_time">Opening time</Label>
                <Input
                  id="opening_time"
                  type="time"
                  value={form.opening_time ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, opening_time: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="closing_time">Closing time</Label>
                <Input
                  id="closing_time"
                  type="time"
                  value={form.closing_time ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, closing_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button disabled={update.isPending} onClick={() => update.mutate()}>
                {update.isPending ? 'Saving...' : 'Save changes'}
              </Button>
              {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
