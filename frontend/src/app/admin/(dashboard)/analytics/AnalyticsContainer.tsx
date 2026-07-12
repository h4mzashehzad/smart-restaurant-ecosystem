'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { ErrorState } from '@/components/admin/ErrorState';
import { EmptyState } from '@/components/admin/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const chartConfig: ChartConfig = {
  total_revenue: { label: 'Revenue', color: 'var(--primary)' },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    amount
  );
}

export default function AnalyticsContainer() {
  const revenue = useQuery({
    queryKey: ['admin', 'analytics', 'revenue'],
    queryFn: () => adminApi.getRevenue({ period: 'daily', days: 30 }),
  });

  const popularItems = useQuery({
    queryKey: ['admin', 'analytics', 'popular-items'],
    queryFn: () => adminApi.getPopularItems({ limit: 8 }),
  });

  const sentiment = useQuery({
    queryKey: ['admin', 'analytics', 'sentiment'],
    queryFn: adminApi.getSentimentSummary,
  });

  const isError = revenue.isError && popularItems.isError && sentiment.isError;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Revenue, popularity, and sentiment insights." />
        <ErrorState
          onRetry={() => {
            revenue.refetch();
            popularItems.refetch();
            sentiment.refetch();
          }}
          description="Couldn't load analytics data."
        />
      </div>
    );
  }

  const revenuePoints = revenue.data ?? [];
  const items = popularItems.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Revenue, popularity, and sentiment insights." />

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Revenue — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          {revenue.isLoading ? (
            <Skeleton className="h-56 w-full rounded-xl" />
          ) : revenuePoints.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No revenue data yet" />
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
              <BarChart data={revenuePoints}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Bar dataKey="total_revenue" fill="var(--color-total_revenue)" radius={4} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Most popular items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {popularItems.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500">No order data yet.</p>
            ) : (
              items.map((item, i) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-50 text-[11px] font-bold text-orange-600">
                      {i + 1}
                    </span>
                    {item.name}
                  </span>
                  <span className="font-medium text-gray-900">{item.total_quantity} sold</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle>Feedback sentiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sentiment.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)
            ) : (sentiment.data?.sentiment_breakdown ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">No sentiment data yet.</p>
            ) : (
              sentiment.data!.sentiment_breakdown.map((entry) => (
                <div key={entry.sentiment_label} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-gray-700">{entry.sentiment_label}</span>
                  <span className="font-medium text-gray-900">{entry.count} reviews</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
