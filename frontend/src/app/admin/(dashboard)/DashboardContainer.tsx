'use client';

import Link from 'next/link';
import { RestaurantSetupChecklist } from '@/components/admin/onboarding/RestaurantSetupChecklist';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Wallet,
  Activity,
  Users,
  CalendarClock,
  Star,
  BellRing,
  Flag,
  ArrowRight,
  ClipboardCheck,
  UtensilsCrossed,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { ErrorState } from '@/components/admin/ErrorState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardContainer() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: adminApi.getDashboardStats,
  });

  const attentionItems = [
    stats && stats.pending_reservations > 0
      ? {
          label: `${stats.pending_reservations} reservation${stats.pending_reservations > 1 ? 's' : ''} awaiting confirmation`,
          href: '/admin/reservations',
          icon: CalendarClock,
        }
      : null,
    stats && stats.open_waiter_requests > 0
      ? {
          label: `${stats.open_waiter_requests} open waiter request${stats.open_waiter_requests > 1 ? 's' : ''}`,
          href: '/admin/waiter-requests',
          icon: BellRing,
        }
      : null,
    stats && stats.flagged_reviews > 0
      ? {
          label: `${stats.flagged_reviews} flagged review${stats.flagged_reviews > 1 ? 's' : ''} to review`,
          href: '/admin/reviews',
          icon: Flag,
        }
      : null,
  ].filter(Boolean) as { label: string; href: string; icon: typeof CalendarClock }[];

  const quickActions = [
    { label: 'View Orders', href: '/admin/orders', icon: ClipboardCheck },
    { label: 'Manage Queue', href: '/admin/queue', icon: Users },
    { label: 'Reservations', href: '/admin/reservations', icon: CalendarClock },
    isAdmin ? { label: 'Edit Menu', href: '/admin/menu', icon: UtensilsCrossed } : null,
    isAdmin ? { label: 'Manage Team', href: '/admin/team', icon: UsersRound } : null,
  ].filter(Boolean) as { label: string; href: string; icon: typeof ClipboardCheck }[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Here's what's happening at your restaurant today."
      />

      <RestaurantSetupChecklist />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load dashboard stats." />
      ) : (
        <>
          <div data-tour-dashboard className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Today's Orders"
              value={stats?.today_orders ?? 0}
              icon={ClipboardList}
              loading={isLoading}
              accent="orange"
            />
            <StatCard
              label="Today's Revenue"
              value={stats ? formatCurrency(stats.today_revenue) : '—'}
              icon={Wallet}
              loading={isLoading}
              accent="emerald"
            />
            <StatCard
              label="Active Orders"
              value={stats?.active_orders ?? 0}
              icon={Activity}
              loading={isLoading}
              accent="blue"
            />
            <StatCard
              label="Total Customers"
              value={stats?.total_customers ?? 0}
              icon={Users}
              loading={isLoading}
              accent="violet"
            />
            <StatCard
              label="Pending Reservations"
              value={stats?.pending_reservations ?? 0}
              icon={CalendarClock}
              loading={isLoading}
              accent="amber"
            />
            <StatCard
              label="Average Rating"
              value={stats ? stats.average_rating.toFixed(1) : '—'}
              icon={Star}
              loading={isLoading}
              accent="amber"
            />
            <StatCard
              label="Waiter Requests"
              value={stats?.open_waiter_requests ?? 0}
              icon={BellRing}
              loading={isLoading}
              accent="violet"
            />
            <StatCard
              label="Flagged Reviews"
              value={stats?.flagged_reviews ?? 0}
              icon={Flag}
              loading={isLoading}
              accent="red"
            />
          </div>

          {attentionItems.length > 0 && (
            <Card className="border-orange-100 bg-orange-50/40">
              <CardContent className="space-y-2 py-1">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                  Needs your attention
                </p>
                <div className="flex flex-col gap-2">
                  {attentionItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-orange-200 hover:bg-orange-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 text-orange-500" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">
              Quick actions
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {quickActions.map((action) => (
                <Button
                  key={action.href}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  nativeButton={false}
                  render={<Link href={action.href} />}
                >
                  <action.icon className="h-5 w-5 text-orange-500" />
                  <span className="text-xs font-semibold">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
