'use client';

import { cn } from '@/lib/utils';
import type { PeakHourPoint } from '@/types/admin';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 10); // 10:00 – 23:00

function intensityClass(value: number, max: number): string {
  if (max <= 0 || value <= 0) return 'bg-gray-50 text-gray-300 ring-1 ring-inset ring-gray-100';
  const ratio = value / max;
  if (ratio >= 0.8) return 'bg-orange-600 text-white';
  if (ratio >= 0.6) return 'bg-orange-500 text-white';
  if (ratio >= 0.4) return 'bg-orange-400 text-white';
  if (ratio >= 0.25) return 'bg-orange-300 text-orange-950';
  if (ratio >= 0.1) return 'bg-orange-100 text-orange-800';
  return 'bg-orange-50 text-orange-600';
}

interface PeakHoursHeatmapProps {
  data: PeakHourPoint[];
}

export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  const lookup = new Map<string, PeakHourPoint>();
  let maxOrders = 0;

  for (const point of data) {
    // MySQL DAYOFWEEK: 1=Sunday … 7=Saturday
    const key = `${point.day_of_week}-${point.hour}`;
    lookup.set(key, point);
    if (point.order_count > maxOrders) maxOrders = point.order_count;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-gray-50/50 p-3">
      <div className="min-w-[640px]">
        <div className="mb-2 grid grid-cols-[3rem_repeat(14,minmax(0,1fr))] gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          <div />
          {HOURS.map((hour) => (
            <div key={hour} className="text-center">
              {hour}:00
            </div>
          ))}
        </div>

        {DAY_LABELS.map((label, dayIndex) => {
          const dayOfWeek = dayIndex + 1;
          return (
            <div
              key={label}
              className="mb-1.5 grid grid-cols-[3rem_repeat(14,minmax(0,1fr))] gap-1.5"
            >
              <div className="flex items-center text-xs font-semibold text-gray-600">{label}</div>
              {HOURS.map((hour) => {
                const point = lookup.get(`${dayOfWeek}-${hour}`);
                const count = point?.order_count ?? 0;
                return (
                  <div
                    key={`${dayOfWeek}-${hour}`}
                    title={
                      point
                        ? `${label} ${hour}:00 — ${count} orders, Rs ${Math.round(Number(point.revenue)).toLocaleString()}`
                        : `${label} ${hour}:00 — no orders`
                    }
                    className={cn(
                      'flex h-9 items-center justify-center rounded-md text-[10px] font-bold tabular-nums transition-colors',
                      intensityClass(count, maxOrders)
                    )}
                  >
                    {count > 0 ? count : ''}
                  </div>
                );
              })}
            </div>
          );
        })}

        <div className="mt-3 flex items-center gap-2 border-t border-gray-200/80 pt-3 text-[11px] text-gray-500">
          <span>Low</span>
          <div className="flex gap-1">
            {['bg-orange-50', 'bg-orange-100', 'bg-orange-300', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600'].map(
              (cls) => (
                <div key={cls} className={cn('h-3 w-5 rounded-sm', cls)} />
              )
            )}
          </div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
