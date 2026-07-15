'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  UtensilsCrossed,
  MessageSquare,
  Gift,
  Timer,
  Package,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { ErrorState } from '@/components/admin/ErrorState';
import { EmptyState } from '@/components/admin/EmptyState';
import { StatCard } from '@/components/admin/StatCard';
import { PeakHoursHeatmap } from '@/components/admin/analytics/PeakHoursHeatmap';
import {
  AnalyticsList,
  AnalyticsListRow,
  AnalyticsMetrics,
  AnalyticsRank,
  AnalyticsRowLabel,
  AnalyticsStatRow,
  SentimentPill,
} from '@/components/admin/analytics/AnalyticsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

const revenueConfig: ChartConfig = {
  total_revenue: { label: 'Revenue', color: 'var(--primary)' },
};

const categoryConfig: ChartConfig = {
  total_revenue: { label: 'Revenue', color: '#f97316' },
};

const sentimentConfig: ChartConfig = {
  positive: { label: 'Positive', color: '#10b981' },
  neutral: { label: 'Neutral', color: '#94a3b8' },
  negative: { label: 'Negative', color: '#ef4444' },
};

const forecastConfig: ChartConfig = {
  predicted_quantity: { label: 'Expected orders', color: '#f97316' },
};

const TIER_COLORS = {
  bronze: '#d97706',
  silver: '#64748b',
  gold: '#eab308',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

type Period = 'daily' | 'weekly' | 'monthly';

export default function AnalyticsContainer() {
  const [period, setPeriod] = useState<Period>('daily');
  const [days, setDays] = useState(30);

  const revenue = useQuery({
    queryKey: ['admin', 'analytics', 'revenue', period, days],
    queryFn: () => adminApi.getRevenue({ period, days }),
  });

  const revenueByCategory = useQuery({
    queryKey: ['admin', 'analytics', 'revenue-by-category', days],
    queryFn: () => adminApi.getRevenueByCategory({ days }),
  });

  const peakHours = useQuery({
    queryKey: ['admin', 'analytics', 'peak-hours', days],
    queryFn: () => adminApi.getPeakHours({ days }),
  });

  const busiestTables = useQuery({
    queryKey: ['admin', 'analytics', 'busiest-tables', days],
    queryFn: () => adminApi.getBusiestTables({ days, limit: 8 }),
  });

  const popularItems = useQuery({
    queryKey: ['admin', 'analytics', 'popular-items', days],
    queryFn: () => adminApi.getPopularItems({ limit: 8, days }),
  });

  const menuPerformance = useQuery({
    queryKey: ['admin', 'analytics', 'menu-performance', days],
    queryFn: () => adminApi.getMenuPerformance({ days }),
  });

  const sentiment = useQuery({
    queryKey: ['admin', 'analytics', 'sentiment', days],
    queryFn: () => adminApi.getSentimentSummary({ days }),
  });

  const sentimentByItem = useQuery({
    queryKey: ['admin', 'analytics', 'sentiment-by-item', days],
    queryFn: () => adminApi.getSentimentByItem({ days, limit: 10 }),
  });

  const loyalty = useQuery({
    queryKey: ['admin', 'analytics', 'loyalty-insights', days],
    queryFn: () => adminApi.getLoyaltyInsights({ days }),
  });

  const fulfillment = useQuery({
    queryKey: ['admin', 'analytics', 'fulfillment', days],
    queryFn: () => adminApi.getFulfillmentPerformance({ days }),
  });

  const turnover = useQuery({
    queryKey: ['admin', 'analytics', 'table-turnover', days],
    queryFn: () => adminApi.getTableTurnover({ days }),
  });

  const wastage = useQuery({
    queryKey: ['admin', 'analytics', 'wastage'],
    queryFn: adminApi.getWastageReport,
  });

  const forecast = useQuery({
    queryKey: ['admin', 'analytics', 'demand-forecast'],
    queryFn: () => adminApi.getDemandForecast(),
  });

  const allFailed =
    revenue.isError &&
    peakHours.isError &&
    popularItems.isError &&
    sentiment.isError;

  const periodRevenue = useMemo(() => {
    const points = revenue.data ?? [];
    return points.reduce((sum, p) => sum + Number(p.total_revenue), 0);
  }, [revenue.data]);

  const periodAov = useMemo(() => {
    const points = revenue.data ?? [];
    if (points.length === 0) return 0;
    const totalOrders = points.reduce((sum, p) => sum + Number(p.total_orders), 0);
    return totalOrders > 0 ? periodRevenue / totalOrders : 0;
  }, [revenue.data, periodRevenue]);

  const sentimentTrendChart = useMemo(() => {
    const trend = sentiment.data?.trend ?? [];
    const byDate = new Map<string, { date: string; positive: number; neutral: number; negative: number }>();
    for (const row of trend) {
      const existing = byDate.get(row.date) ?? {
        date: row.date,
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      if (row.sentiment_label === 'positive') existing.positive = row.count;
      if (row.sentiment_label === 'neutral') existing.neutral = row.count;
      if (row.sentiment_label === 'negative') existing.negative = row.count;
      byDate.set(row.date, existing);
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [sentiment.data]);

  const tierPie = useMemo(() => {
    const dist = loyalty.data?.tier_distribution;
    if (!dist) return [];
    return [
      { name: 'Bronze', value: dist.bronze, fill: TIER_COLORS.bronze },
      { name: 'Silver', value: dist.silver, fill: TIER_COLORS.silver },
      { name: 'Gold', value: dist.gold, fill: TIER_COLORS.gold },
    ].filter((d) => d.value > 0);
  }, [loyalty.data]);

  function refetchAll() {
    revenue.refetch();
    revenueByCategory.refetch();
    peakHours.refetch();
    busiestTables.refetch();
    popularItems.refetch();
    menuPerformance.refetch();
    sentiment.refetch();
    sentimentByItem.refetch();
    loyalty.refetch();
    fulfillment.refetch();
    turnover.refetch();
    wastage.refetch();
    forecast.refetch();
  }

  if (allFailed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Business intelligence across revenue, menu, sentiment, and operations." />
        <ErrorState onRetry={refetchAll} description="Couldn't load analytics data." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Business intelligence across revenue, menu, sentiment, loyalty, and kitchen performance."
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="line" className="mb-4 h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview" className="px-3 py-1.5">Overview</TabsTrigger>
          <TabsTrigger value="revenue" className="px-3 py-1.5">Revenue</TabsTrigger>
          <TabsTrigger value="peak" className="px-3 py-1.5">Peak Hours</TabsTrigger>
          <TabsTrigger value="menu" className="px-3 py-1.5">Menu</TabsTrigger>
          <TabsTrigger value="sentiment" className="px-3 py-1.5">Sentiment</TabsTrigger>
          <TabsTrigger value="loyalty" className="px-3 py-1.5">Loyalty</TabsTrigger>
          <TabsTrigger value="ops" className="px-3 py-1.5">Fulfillment</TabsTrigger>
          <TabsTrigger value="forecast" className="px-3 py-1.5">Forecast</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Period Revenue"
              value={revenue.isLoading ? '—' : formatCurrency(periodRevenue)}
              icon={TrendingUp}
              loading={revenue.isLoading}
              accent="orange"
            />
            <StatCard
              label="Avg Order Value"
              value={revenue.isLoading ? '—' : formatCurrency(periodAov)}
              icon={UtensilsCrossed}
              loading={revenue.isLoading}
              accent="emerald"
            />
            <StatCard
              label="Avg Fulfillment"
              value={
                fulfillment.isLoading
                  ? '—'
                  : `${fulfillment.data?.avg_total_fulfillment_minutes ?? 0} min`
              }
              icon={Timer}
              loading={fulfillment.isLoading}
              accent="blue"
            />
            <StatCard
              label="Table Turnover"
              value={
                turnover.isLoading
                  ? '—'
                  : `${turnover.data?.sessions_per_table_per_day ?? 0}/day`
              }
              icon={Clock}
              loading={turnover.isLoading}
              accent="violet"
            />
            <StatCard
              label="Churn Risk"
              value={loyalty.data?.churn_risk_count ?? 0}
              icon={Gift}
              loading={loyalty.isLoading}
              accent="amber"
            />
            <StatCard
              label="Review Response"
              value={sentiment.isLoading ? '—' : `${sentiment.data?.response_rate ?? 0}%`}
              icon={MessageSquare}
              loading={sentiment.isLoading}
              accent="emerald"
            />
            <StatCard
              label="Low Stock Items"
              value={wastage.data?.total_low_stock ?? 0}
              icon={Package}
              loading={wastage.isLoading}
              accent="red"
            />
            <StatCard
              label="Cancellation Rate"
              value={
                fulfillment.isLoading ? '—' : `${fulfillment.data?.cancellation_rate ?? 0}%`
              }
              icon={Timer}
              loading={fulfillment.isLoading}
              accent="amber"
            />
          </div>
        </TabsContent>

        {/* ── Revenue ── */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  period === p
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Revenue — last {days} days</CardTitle>
            </CardHeader>
            <CardContent>
              {revenue.isLoading ? (
                <Skeleton className="h-56 w-full rounded-xl" />
              ) : (revenue.data ?? []).length === 0 ? (
                <EmptyState icon={TrendingUp} title="No revenue data yet" />
              ) : (
                <ChartContainer config={revenueConfig} className="aspect-auto h-56 w-full">
                  <BarChart data={revenue.data}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
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

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Revenue by category</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByCategory.isLoading ? (
                <Skeleton className="h-56 w-full rounded-xl" />
              ) : (revenueByCategory.data ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No category revenue yet.</p>
              ) : (
                <ChartContainer config={categoryConfig} className="aspect-auto h-56 w-full">
                  <BarChart data={revenueByCategory.data} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="category_name"
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      tick={{ fontSize: 11 }}
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
        </TabsContent>

        {/* ── Peak Hours ── */}
        <TabsContent value="peak" className="space-y-4">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Peak hours heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              {peakHours.isLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : (peakHours.data ?? []).length === 0 ? (
                <EmptyState icon={Clock} title="No peak-hour data yet" />
              ) : (
                <PeakHoursHeatmap data={peakHours.data ?? []} />
              )}
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Busiest tables</CardTitle>
            </CardHeader>
            <CardContent>
              {busiestTables.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : (busiestTables.data ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No table revenue data yet.</p>
              ) : (
                <AnalyticsList>
                  {busiestTables.data!.map((table, i) => (
                    <AnalyticsListRow key={table.table_id}>
                      <AnalyticsRowLabel
                        leading={<AnalyticsRank rank={i + 1} />}
                        title={`Table ${table.table_number}`}
                      />
                      <AnalyticsMetrics
                        primary={formatCurrency(Number(table.total_revenue))}
                        secondary={`${table.order_count} orders`}
                      />
                    </AnalyticsListRow>
                  ))}
                </AnalyticsList>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Menu ── */}
        <TabsContent value="menu" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Most popular items</CardTitle>
              </CardHeader>
              <CardContent>
                {popularItems.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (popularItems.data ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No order data yet.</p>
                ) : (
                  <AnalyticsList>
                    {popularItems.data!.map((item, i) => (
                      <AnalyticsListRow key={item.id}>
                        <AnalyticsRowLabel
                          leading={<AnalyticsRank rank={i + 1} />}
                          title={item.name}
                        />
                        <AnalyticsMetrics
                          primary={formatCurrency(Number(item.total_revenue))}
                          secondary={`${item.total_quantity} sold`}
                        />
                      </AnalyticsListRow>
                    ))}
                  </AnalyticsList>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Category performance</CardTitle>
              </CardHeader>
              <CardContent>
                {menuPerformance.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (menuPerformance.data?.categories ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No category data yet.</p>
                ) : (
                  <AnalyticsList>
                    {menuPerformance.data!.categories.map((cat) => (
                      <AnalyticsListRow key={cat.category_id}>
                        <AnalyticsRowLabel title={cat.category_name} />
                        <AnalyticsMetrics
                          primary={formatCurrency(cat.total_revenue)}
                          secondary={`★ ${cat.avg_rating.toFixed(1)} avg rating`}
                        />
                      </AnalyticsListRow>
                    ))}
                  </AnalyticsList>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Underperforming items</CardTitle>
            </CardHeader>
            <CardContent>
              {menuPerformance.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : (menuPerformance.data?.underperforming_items ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No underperforming items flagged.</p>
              ) : (
                <AnalyticsList>
                  {menuPerformance.data!.underperforming_items.map((item) => (
                    <AnalyticsListRow key={item.id}>
                      <AnalyticsRowLabel
                        title={item.name}
                        subtitle={
                          <span className="flex flex-wrap items-center gap-1.5">
                            {item.reasons.map((r) => (
                              <SentimentPill
                                key={r}
                                label={r.split('_').join(' ')}
                                className={
                                  r.includes('negative')
                                    ? undefined
                                    : 'bg-amber-50 text-amber-700 ring-amber-200'
                                }
                              />
                            ))}
                          </span>
                        }
                      />
                      <AnalyticsMetrics
                        primary={`${item.total_quantity} sold`}
                        primaryClassName="text-gray-700"
                      />
                    </AnalyticsListRow>
                  ))}
                </AnalyticsList>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sentiment ── */}
        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Total Reviews"
              value={sentiment.data?.total_reviews ?? 0}
              icon={MessageSquare}
              loading={sentiment.isLoading}
              accent="orange"
            />
            <StatCard
              label="Flagged"
              value={sentiment.data?.flagged_reviews ?? 0}
              icon={MessageSquare}
              loading={sentiment.isLoading}
              accent="red"
            />
            <StatCard
              label="Response Rate"
              value={`${sentiment.data?.response_rate ?? 0}%`}
              icon={MessageSquare}
              loading={sentiment.isLoading}
              accent="emerald"
            />
          </div>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Sentiment trend</CardTitle>
            </CardHeader>
            <CardContent>
              {sentiment.isLoading ? (
                <Skeleton className="h-56 w-full rounded-xl" />
              ) : sentimentTrendChart.length === 0 ? (
                <EmptyState icon={MessageSquare} title="No sentiment trend yet" />
              ) : (
                <ChartContainer config={sentimentConfig} className="aspect-auto h-56 w-full">
                  <LineChart data={sentimentTrendChart}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="positive" stroke="var(--color-positive)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="neutral" stroke="var(--color-neutral)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="negative" stroke="var(--color-negative)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Overall breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {(sentiment.data?.sentiment_breakdown ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No sentiment data yet.</p>
                ) : (
                  <AnalyticsList>
                    {sentiment.data!.sentiment_breakdown.map((entry) => (
                      <AnalyticsListRow key={entry.sentiment_label}>
                        <SentimentPill label={entry.sentiment_label} />
                        <AnalyticsMetrics
                          primary={entry.count}
                          secondary="reviews"
                        />
                      </AnalyticsListRow>
                    ))}
                  </AnalyticsList>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Weakest item sentiment</CardTitle>
              </CardHeader>
              <CardContent>
                {sentimentByItem.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (sentimentByItem.data ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">No per-item sentiment yet.</p>
                ) : (
                  <AnalyticsList>
                    {sentimentByItem.data!.map((item) => {
                      const score = Number(item.avg_sentiment_score);
                      return (
                        <AnalyticsListRow key={item.id}>
                          <AnalyticsRowLabel title={item.name} />
                          <AnalyticsMetrics
                            primary={score.toFixed(2)}
                            primaryClassName={
                              score < -0.2
                                ? 'text-red-600'
                                : score < 0.2
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                            }
                            secondary={`${item.negative_count} negative`}
                          />
                        </AnalyticsListRow>
                      );
                    })}
                  </AnalyticsList>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Loyalty ── */}
        <TabsContent value="loyalty" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Loyalty Revenue Share"
              value={`${loyalty.data?.loyalty_revenue_share ?? 0}%`}
              icon={Gift}
              loading={loyalty.isLoading}
              accent="orange"
            />
            <StatCard
              label="Repeat Visit Rate"
              value={`${loyalty.data?.repeat_visit_rate ?? 0}%`}
              icon={TrendingUp}
              loading={loyalty.isLoading}
              accent="emerald"
            />
            <StatCard
              label="Points Redeemed"
              value={loyalty.data?.points_redeemed?.toLocaleString() ?? 0}
              icon={Gift}
              loading={loyalty.isLoading}
              accent="violet"
            />
            <StatCard
              label="Churn Risk"
              value={loyalty.data?.churn_risk_count ?? 0}
              icon={Gift}
              loading={loyalty.isLoading}
              accent="amber"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Tier distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {loyalty.isLoading ? (
                  <Skeleton className="h-48 w-full rounded-xl" />
                ) : tierPie.length === 0 ? (
                  <p className="text-sm text-gray-500">No loyalty customers yet.</p>
                ) : (
                  <ChartContainer
                    config={{
                      bronze: { label: 'Bronze', color: TIER_COLORS.bronze },
                      silver: { label: 'Silver', color: TIER_COLORS.silver },
                      gold: { label: 'Gold', color: TIER_COLORS.gold },
                    }}
                    className="aspect-auto mx-auto h-48 w-full max-w-xs"
                  >
                    <PieChart>
                      <Pie data={tierPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                        {tierPie.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Revenue split</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsList>
                  <AnalyticsStatRow
                    label="Loyalty customers"
                    value={formatCurrency(loyalty.data?.loyalty_revenue ?? 0)}
                    hint={`${loyalty.data?.loyalty_order_count ?? 0} orders`}
                  />
                  <AnalyticsStatRow
                    label="Guest / anonymous"
                    value={formatCurrency(loyalty.data?.guest_revenue ?? 0)}
                    hint={`${loyalty.data?.guest_order_count ?? 0} orders`}
                  />
                </AnalyticsList>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Churn-risk customers</CardTitle>
            </CardHeader>
            <CardContent>
              {(loyalty.data?.churn_risk_customers ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No churn-risk customers right now.</p>
              ) : (
                <AnalyticsList>
                  {loyalty.data!.churn_risk_customers.map((c) => (
                    <AnalyticsListRow key={c.id}>
                      <AnalyticsRowLabel
                        title={c.name}
                        subtitle={c.email}
                      />
                      <AnalyticsMetrics
                        primary={
                          <span className="capitalize">{c.loyalty_tier}</span>
                        }
                        secondary={
                          c.last_order_at
                            ? `Last ${new Date(c.last_order_at).toLocaleDateString()}`
                            : 'No recent order'
                        }
                      />
                    </AnalyticsListRow>
                  ))}
                </AnalyticsList>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Fulfillment & Wastage ── */}
        <TabsContent value="ops" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Confirm Time"
              value={`${fulfillment.data?.avg_confirm_minutes ?? 0} min`}
              icon={Timer}
              loading={fulfillment.isLoading}
              accent="blue"
            />
            <StatCard
              label="Prep Time"
              value={`${fulfillment.data?.avg_prep_minutes ?? 0} min`}
              icon={UtensilsCrossed}
              loading={fulfillment.isLoading}
              accent="orange"
            />
            <StatCard
              label="Serve Time"
              value={`${fulfillment.data?.avg_serve_minutes ?? 0} min`}
              icon={Clock}
              loading={fulfillment.isLoading}
              accent="emerald"
            />
            <StatCard
              label="Complaint Rate"
              value={`${fulfillment.data?.complaint_rate ?? 0}%`}
              icon={MessageSquare}
              loading={fulfillment.isLoading}
              accent="red"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Table turnover</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnalyticsList>
                  <AnalyticsStatRow
                    label="Avg session"
                    value={`${turnover.data?.avg_session_minutes ?? 0} min`}
                  />
                  <AnalyticsStatRow
                    label="Total sessions"
                    value={turnover.data?.total_sessions ?? 0}
                  />
                  <AnalyticsStatRow
                    label="Sessions / table / day"
                    value={turnover.data?.sessions_per_table_per_day ?? 0}
                  />
                </AnalyticsList>
                {(turnover.data?.tables ?? []).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      By table
                    </p>
                    <AnalyticsList>
                      {(turnover.data?.tables ?? []).slice(0, 6).map((t) => (
                        <AnalyticsListRow key={t.table_id}>
                          <AnalyticsRowLabel title={`Table ${t.table_number}`} />
                          <AnalyticsMetrics
                            primary={`${t.session_count} sessions`}
                            secondary={`${Number(t.avg_duration_minutes).toFixed(0)} min avg`}
                          />
                        </AnalyticsListRow>
                      ))}
                    </AnalyticsList>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Low-stock ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                {wastage.isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (wastage.data?.low_stock_ingredients ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500">All ingredients are above threshold.</p>
                ) : (
                  <AnalyticsList>
                    {wastage.data!.low_stock_ingredients.map((ing) => (
                      <AnalyticsListRow key={ing.id}>
                        <AnalyticsRowLabel
                          title={ing.name}
                          subtitle={`Min ${ing.minimum_threshold} ${ing.unit ?? ''}`.trim()}
                        />
                        <AnalyticsMetrics
                          primary={`${ing.stock_quantity} ${ing.unit ?? ''}`.trim()}
                          primaryClassName="text-red-600"
                          secondary="in stock"
                        />
                      </AnalyticsListRow>
                    ))}
                  </AnalyticsList>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Demand Forecast ── */}
        <TabsContent value="forecast" className="space-y-4">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>
                Expected demand by hour
                {forecast.data?.forecast_date ? ` — ${forecast.data.forecast_date}` : ''}
              </CardTitle>
              <CardDescription>
                How many portions you are likely to sell across the day. Use this to plan staffing and kitchen timing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forecast.isLoading ? (
                <Skeleton className="h-56 w-full rounded-xl" />
              ) : forecast.data?.insufficient_data || (forecast.data?.items ?? []).length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Forecast not ready yet"
                  description="The ML forecaster needs more historical order data. Run the nightly forecast job once you have enough completed orders."
                />
              ) : (
                <ChartContainer config={forecastConfig} className="aspect-auto h-56 w-full">
                  <BarChart data={forecast.data!.totals_by_hour}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(h) => `${h}:00`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${Number(value)} expected`}
                        />
                      }
                    />
                    <Bar dataKey="predicted_quantity" fill="var(--color-predicted_quantity)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {!forecast.data?.insufficient_data && (forecast.data?.items ?? []).length > 0 && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>What to prepare today</CardTitle>
                <CardDescription>
                  Suggested prep quantity includes a small buffer (~10%) over expected demand so you do not run out during peak hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsList>
                  {forecast.data!.items.slice(0, 10).map((item, i) => {
                    const buffer = Math.max(
                      0,
                      item.recommended_prep_quantity - item.total_daily
                    );
                    return (
                      <AnalyticsListRow key={item.menu_item_id}>
                        <AnalyticsRowLabel
                          leading={<AnalyticsRank rank={i + 1} />}
                          title={item.name}
                          subtitle={
                            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span>
                                Expect ~{item.total_daily} order
                                {item.total_daily === 1 ? '' : 's'}
                              </span>
                              {buffer > 0 ? (
                                <span className="text-gray-400">· +{buffer} buffer</span>
                              ) : null}
                              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                                {(item.avg_confidence * 100).toFixed(0)}% confidence
                              </span>
                            </span>
                          }
                        />
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-500/80">
                            Prepare
                          </p>
                          <p className="text-xl font-bold tabular-nums leading-tight text-orange-600">
                            {item.recommended_prep_quantity}
                          </p>
                          <p className="text-xs text-gray-500">portions</p>
                        </div>
                      </AnalyticsListRow>
                    );
                  })}
                </AnalyticsList>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
