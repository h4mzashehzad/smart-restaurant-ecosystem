import { cn } from '@/lib/utils';

type Tone = 'gray' | 'blue' | 'amber' | 'emerald' | 'red' | 'violet' | 'orange' | 'indigo' | 'teal';

const TONE_CLASSES: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
};

// Maps every status string used across the dashboard (orders, reservations,
// queue, service requests, payments, tables) to a display label + tone.
const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  // Orders
  pending: { label: 'Pending', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'blue' },
  preparing: { label: 'Preparing', tone: 'orange' },
  ready: { label: 'Ready', tone: 'violet' },
  served: { label: 'Served', tone: 'teal' },
  completed: { label: 'Completed', tone: 'emerald' },
  cancelled: { label: 'Cancelled', tone: 'red' },

  // Reservations / Queue
  seated: { label: 'Seated', tone: 'emerald' },
  called: { label: 'Called', tone: 'blue' },
  no_show: { label: 'No Show', tone: 'red' },
  waiting: { label: 'Waiting', tone: 'indigo' },

  // Service requests
  acknowledged: { label: 'Acknowledged', tone: 'blue' },
  in_progress: { label: 'In Progress', tone: 'violet' },
  resolved: { label: 'Resolved', tone: 'emerald' },
  low: { label: 'Low', tone: 'gray' },
  medium: { label: 'Medium', tone: 'blue' },
  high: { label: 'High', tone: 'amber' },
  urgent: { label: 'Urgent', tone: 'red' },

  // Payments
  processing: { label: 'Processing', tone: 'blue' },
  failed: { label: 'Failed', tone: 'red' },
  refunded: { label: 'Refunded', tone: 'gray' },

  // Tables
  available: { label: 'Available', tone: 'emerald' },
  occupied: { label: 'Occupied', tone: 'amber' },
  reserved: { label: 'Reserved', tone: 'blue' },
  cleaning: { label: 'Cleaning', tone: 'violet' },
  inactive: { label: 'Inactive', tone: 'gray' },

  // Team / restaurant
  active: { label: 'Active', tone: 'emerald' },

  // Feedback
  flagged: { label: 'Flagged', tone: 'red' },
  positive: { label: 'Positive', tone: 'emerald' },
  negative: { label: 'Negative', tone: 'red' },
  neutral: { label: 'Neutral', tone: 'gray' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status?.toLowerCase?.() ?? status;
  const entry = STATUS_MAP[normalized] ?? { label: status, tone: 'gray' as Tone };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap',
        TONE_CLASSES[entry.tone],
        className
      )}
    >
      {entry.label}
    </span>
  );
}
