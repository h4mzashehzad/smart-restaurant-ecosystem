'use client';

import {
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClockIcon,
  TicketIcon,
} from '@heroicons/react/24/outline';

export interface Reservation {
  id: number;
  guest_name: string;
  guest_phone: string;
  guest_email?: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  table?: { id: number; table_number: string; capacity: number } | null;
  table_id?: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  special_requests?: string;
  confirmation_code: string;
  confirmed_at?: string;
  cancelled_at?: string;
}

interface Props {
  reservation: Reservation;
  onUpdateStatus: (reservationId: number, status: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',   color: 'text-amber-400',   bg: 'bg-amber-400/10 border-amber-400/30' },
  confirmed: { label: 'Confirmed', color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/30' },
  seated:    { label: 'Seated',    color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  completed: { label: 'Completed', color: 'text-gray-400',    bg: 'bg-gray-400/10 border-gray-400/30' },
  cancelled: { label: 'Cancelled', color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30' },
  no_show:   { label: 'No Show',   color: 'text-red-400',     bg: 'bg-red-400/10 border-red-400/30' },
};

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function ReservationCard({ reservation, onUpdateStatus }: Props) {
  const r = reservation;
  const status = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col gap-3 transition-all hover:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-bold text-base">{r.guest_name}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{r.guest_phone}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${status.bg} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <ClockIcon className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>{formatTime(r.reservation_time)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <UserGroupIcon className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>{r.party_size} {r.party_size === 1 ? 'guest' : 'guests'}</span>
        </div>
        {r.table && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-4 h-4 rounded bg-teal-500/20 text-teal-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">T</span>
            <span>Table #{r.table.table_number}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <TicketIcon className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="font-mono text-xs">{r.confirmation_code}</span>
        </div>
      </div>

      {/* Special Requests */}
      {r.special_requests && (
        <div className="text-xs text-gray-500 bg-gray-800/50 rounded-xl px-3 py-2 border border-gray-800">
          <span className="text-gray-400 font-semibold">Note:</span> {r.special_requests}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-1">
        {r.status === 'pending' && (
          <>
            <button
              onClick={() => onUpdateStatus(r.id, 'confirmed')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 text-blue-400 text-xs font-bold hover:bg-blue-500/25 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Confirm
            </button>
            <button
              onClick={() => onUpdateStatus(r.id, 'cancelled')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </>
        )}
        {r.status === 'confirmed' && (
          <>
            <button
              onClick={() => onUpdateStatus(r.id, 'seated')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Seat
            </button>
            <button
              onClick={() => onUpdateStatus(r.id, 'no_show')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-colors"
            >
              <ExclamationTriangleIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onUpdateStatus(r.id, 'cancelled')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 text-red-400 text-xs font-bold hover:bg-red-500/25 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </>
        )}
        {r.status === 'seated' && (
          <>
            <button
              onClick={() => onUpdateStatus(r.id, 'completed')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Complete
            </button>
            <button
              onClick={() => onUpdateStatus(r.id, 'no_show')}
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
