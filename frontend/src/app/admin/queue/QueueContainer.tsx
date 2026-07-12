'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { socketClient } from '@/lib/socket';
import { QueueEntry } from '@/components/kds/QueueEntryCard';
import {
  UserPlusIcon,
  UsersIcon,
  PhoneIcon,
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
} from '@heroicons/react/24/outline';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  waiting:   { label: 'Waiting',   color: 'text-indigo-600',  bg: 'bg-indigo-50 border-indigo-200' },
  called:    { label: 'Called',    color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200' },
  seated:    { label: 'Seated',    color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
  no_show:   { label: 'No Show',   color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
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

export default function QueueContainer() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const mountedRef = useRef(true);
  const restaurantId = user?.restaurant_id ?? null;

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  // Socket setup
  useEffect(() => {
    if (authLoading || !user || !restaurantId) return;

    mountedRef.current = true;
    socketClient.connect();
    socketClient.joinKitchen(restaurantId);

    const handleConnect    = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    socketClient.onConnect(handleConnect);
    socketClient.onDisconnect(handleDisconnect);

    socketClient.onKitchenInitialQueue((initial: QueueEntry[]) => {
      if (mountedRef.current) setQueueEntries(initial ?? []);
    });

    socketClient.onQueueUpdated((data: { entry: QueueEntry; action: string }) => {
      if (!mountedRef.current) return;
      const { entry, action } = data;
      if (action === 'joined') {
        setQueueEntries((prev) => prev.some((e) => e.id === entry.id) ? prev : [...prev, entry]);
      } else {
        setQueueEntries((prev) => prev.map((e) => e.id === entry.id ? entry : e));
      }
    });

    setConnected(socketClient.isConnected());

    return () => {
      mountedRef.current = false;
      socketClient.offKitchenInitialQueue();
      socketClient.offQueueUpdated();
      socketClient.leaveKitchen();
    };
  }, [authLoading, user, restaurantId]);

  const handleQueueStatus = useCallback((entryId: number, status: string) => {
    socketClient.updateQueueStatus(entryId, status);
    // Optimistic update
    setQueueEntries((prev) => prev.map((e) =>
      e.id === entryId ? { ...e, status: status as QueueEntry['status'] } : e
    ));
  }, []);

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !restaurantId) return;

    setSubmitting(true);
    setError('');

    try {
      await api.joinQueue({
        restaurant_id: restaurantId,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        party_size: partySize,
      });
      // Reset form on success
      setGuestName('');
      setGuestPhone('');
      setPartySize(2);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add guest to queue.'));
    } finally {
      setSubmitting(false);
    }
  };

  const activeQueue = queueEntries
    .filter((e) => ['waiting', 'called'].includes(e.status))
    .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-gray-900">Host Stand</h1>
              <p className="text-xs text-gray-500 font-medium">Walk-In Queue Management</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold font-display leading-none text-indigo-600">{activeQueue.length}</p>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Waiting</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-gray-600">{connected ? 'Live Sync' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Col: Add Guest Form ──────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5 text-indigo-500" />
              Add Walk-In Guest
            </h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Guest Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="Enter name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-medium"
                    placeholder="Enter phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Party Size</label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-1.5">
                  <button
                    type="button"
                    onClick={() => setPartySize(Math.max(1, partySize - 1))}
                    className="flex-1 py-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-600 font-bold transition-all disabled:opacity-30"
                    disabled={partySize <= 1}
                  >
                    −
                  </button>
                  <span className="font-display font-bold text-gray-900 w-8 text-center">{partySize}</span>
                  <button
                    type="button"
                    onClick={() => setPartySize(Math.min(20, partySize + 1))}
                    className="flex-1 py-1.5 rounded-lg hover:bg-white hover:shadow-sm text-gray-600 font-bold transition-all disabled:opacity-30"
                    disabled={partySize >= 20}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !guestName.trim() || !guestPhone.trim()}
                className="w-full py-3 mt-2 rounded-xl bg-indigo-600 text-white font-bold text-sm transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? 'Adding...' : 'Add to Queue'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right Col: Active Queue ────────────────────────────────────── */}
        <div className="lg:col-span-8">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            Live Queue Waitlist
          </h2>

          {activeQueue.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-display font-bold text-gray-900 text-lg mb-1">Queue is empty</h3>
              <p className="text-sm text-gray-500 max-w-sm">There are no customers currently waiting in the queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeQueue.map((entry) => {
                const statusInfo = STATUS_CONFIG[entry.status] || STATUS_CONFIG.waiting;
                return (
                  <div key={entry.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-indigo-300 transition-all flex flex-col gap-4">
                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 font-display font-bold text-xl text-gray-900 flex items-center justify-center">
                          {entry.queue_number}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{entry.guest_name}</h4>
                          <p className="text-xs text-gray-500">{entry.guest_phone}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        {entry.party_size}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-300" />
                      <div>Waiting: {timeAgo(entry.joined_at)}</div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      {entry.status === 'waiting' && (
                        <>
                          <button
                            onClick={() => handleQueueStatus(entry.id, 'called')}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            <MegaphoneIcon className="w-4 h-4" />
                            Call Name
                          </button>
                          <button
                            onClick={() => handleQueueStatus(entry.id, 'cancelled')}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-500 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      )}
                      {entry.status === 'called' && (
                        <>
                          <button
                            onClick={() => handleQueueStatus(entry.id, 'seated')}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Seat Table
                          </button>
                          <button
                            onClick={() => handleQueueStatus(entry.id, 'no_show')}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-bold hover:bg-amber-100 transition-colors"
                          >
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            No-Show
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
