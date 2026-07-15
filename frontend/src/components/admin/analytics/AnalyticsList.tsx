import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function AnalyticsList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn('divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white', className)}>
      {children}
    </ul>
  );
}

export function AnalyticsListRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        'flex items-center justify-between gap-4 px-3.5 py-3 transition-colors hover:bg-orange-50/40',
        className
      )}
    >
      {children}
    </li>
  );
}

export function AnalyticsRank({ rank }: { rank: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[11px] font-bold tabular-nums text-orange-700">
      {rank}
    </span>
  );
}

export function AnalyticsRowLabel({
  title,
  subtitle,
  leading,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 items-start gap-2.5', className)}>
      {leading}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{title}</p>
        {subtitle ? <div className="mt-1 text-xs text-gray-500">{subtitle}</div> : null}
      </div>
    </div>
  );
}

export function AnalyticsMetrics({
  primary,
  secondary,
  className,
  primaryClassName,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  className?: string;
  primaryClassName?: string;
}) {
  return (
    <div className={cn('shrink-0 text-right', className)}>
      <div className={cn('text-sm font-semibold tabular-nums text-gray-900', primaryClassName)}>
        {primary}
      </div>
      {secondary ? (
        <div className="mt-0.5 text-xs tabular-nums text-gray-500">{secondary}</div>
      ) : null}
    </div>
  );
}

const SENTIMENT_STYLES = {
  positive: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  neutral: 'bg-slate-50 text-slate-600 ring-slate-200',
  negative: 'bg-red-50 text-red-700 ring-red-200',
} as const;

export function SentimentPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const key = label.toLowerCase() as keyof typeof SENTIMENT_STYLES;
  const styles = SENTIMENT_STYLES[key] ?? SENTIMENT_STYLES.neutral;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset',
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}

export function AnalyticsStatRow({
  label,
  value,
  hint,
  leading,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <AnalyticsListRow>
      <div className="flex min-w-0 items-center gap-2.5">
        {leading}
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold tabular-nums text-gray-900">{value}</span>
        {hint ? <span className="ml-1.5 text-xs text-gray-500">{hint}</span> : null}
      </div>
    </AnalyticsListRow>
  );
}
