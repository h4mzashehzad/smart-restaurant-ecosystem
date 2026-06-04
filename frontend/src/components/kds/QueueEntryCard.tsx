'use client';

import {
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClockIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

export interface QueueEntry {
  id: number;
  guest_name: string;
  guest_phone: string;
  party_size: number;
  queue_number: number;
  estimated_wait_time: number | null;
  status: 'waiting' | 'called' | 'seated' | 'cancelled' | 'no_show';
  joined_at: string;
  called_at?: string;
  seated_at?: string;
}

interface Props {
  entry: QueueEntry;
  onUpdateStatus: (entryId: number, status: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  waiting:   { label: 'Waiting',   color: 'text-indigo-400',  bg: 'bg-indigo-400/10 border-indigo-400/30' },
  called:    { label: 'Called',    color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/30' },
  seated:    { label: 'Seated',    color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  cancelled: { label: 'Cancelled', color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30' },
  no_show:   { label: 'No Show',   color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30' },
};

function timeAgo(dateStr: string): string {
  const now = new Date().getTime();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  return `${hours}h ${diffMin % 60}m ago`;
}

export default function QueueEntryCard({ entry, onUpdateStatus }: Props) {
  const e = entry;
  const status = STATUS_CONFIG[e.status] || STATUS_CONFIG.waiting;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col gap-3 transition-all hover:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-display font-bold text-lg flex items-center justify-center flex-shrink-0">
            {e.queue_number}
          </div>
          <div>
            <h3 className="text-white font-bold text-base">{e.guest_name}</h3>
            <p className="text-gray-500 text-xs">{e.guest_phone}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <UserGroupIcon className="w-4 h-4 text-indigo-400" />
          <span>{e.party_size} {e.party_size === 1 ? 'guest' : 'guests'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ClockIcon className="w-4 h-4 text-indigo-400" />
          <span>{timeAgo(e.joined_at)}</span>
        </div>
        {e.estimated_wait_time && (
          <div className="text-xs text-gray-500">
            ~{e.estimated_wait_time} min wait
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-1">
        {e.status === 'waiting' && (
          <>
            <button
              onClick={() => onUpdateStatus(e.id, 'called')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 text-blue-400 text-xs font-bold hover:bg-blue-500/25 transition-colors"
            >
              <MegaphoneIcon className="w-4 h-4" />
              Call
            </button>
            <button
              onClick={() => onUpdateStatus(e.id, 'cancelled')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </>
        )}
        {e.status === 'called' && (
          <>
            <button
              onClick={() => onUpdateStatus(e.id, 'seated')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Seat
            </button>
            <button
              onClick={() => onUpdateStatus(e.id, 'no_show')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-colors"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
