import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: string;
    direction?: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
  accent?: 'orange' | 'emerald' | 'blue' | 'violet' | 'amber' | 'red';
  href?: string;
  className?: string;
}

const ACCENT_CLASSES: Record<NonNullable<StatCardProps['accent']>, string> = {
  orange: 'bg-orange-50 text-orange-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
};

const TREND_CLASSES: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-emerald-600',
  down: 'text-red-600',
  neutral: 'text-gray-500',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  loading,
  accent = 'orange',
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn('border-gray-200', className)}>
        <CardContent className="flex flex-col gap-3 py-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-gray-200 transition-shadow hover:shadow-md', className)}>
      <CardContent className="flex items-start justify-between gap-3 py-1">
        <div className="flex flex-col gap-1.5 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 truncate">
            {label}
          </p>
          <p className="font-display text-2xl font-bold text-gray-900 leading-none">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium', TREND_CLASSES[trend.direction ?? 'neutral'])}>
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              ACCENT_CLASSES[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
