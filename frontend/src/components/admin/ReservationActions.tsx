'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { ReservationPreorder } from '@/types/reservation';

export function ReservationActions({ reservation: r, onUpdated }: {
  reservation: { id: number; status: string; checkout_state?: string; cancellation_fee_percent?: number; preorder?: ReservationPreorder | null };
  onUpdated: () => void;
}) {
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('customer');
  const [reason, setReason] = useState('');
  const [sessionMode, setSessionMode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unpaid = ['pending', 'expired', 'failed'].includes(r.checkout_state || '');
  const paid = r.preorder?.payments.some(p => !!p.paid_at);
  const amount = paid ? Number(r.preorder?.total_amount || 0) : 0;
  const fee = actor === 'restaurant' ? 0 : Math.round(amount * (r.cancellation_fee_percent ?? 5)) / 100;

  async function apply(status: string) {
    setBusy(true); setError('');
    try {
      await api.http.patch(`/admin/reservations/${r.id}/status`, { status,
        ...(status === 'cancelled' ? { cancellation_actor: actor, reason } : {}),
        ...(status === 'seated' && r.preorder ? sessionMode === 'existing' ? { session_id: Number(sessionId) } : { confirm_new_session: true } : {}),
      });
      setAction(''); onUpdated();
    } catch (cause: unknown) {
      setError((cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unable to update reservation.');
    } finally { setBusy(false); }
  }

  const button = 'rounded-xl border border-current/20 px-3 py-2 text-xs font-semibold disabled:opacity-50 hover:bg-orange-500/10';
  return <div className="space-y-3 text-left whitespace-normal">
    {unpaid ? <p className="text-xs text-amber-600">Preorder payment {r.checkout_state}; no kitchen ticket.</p> : <div className="flex flex-wrap gap-2">
      {r.status === 'pending' && <button disabled={busy} onClick={() => apply('confirmed')} className={button}>Confirm</button>}
      {r.status === 'confirmed' && <><button disabled={busy} onClick={() => r.preorder ? setAction('seated') : apply('seated')} className={button}>Seat</button><button disabled={busy} onClick={() => apply('no_show')} className={button}>No-show</button></>}
      {r.status === 'seated' && <button disabled={busy} onClick={() => apply('completed')} className={button}>Complete</button>}
      {['pending', 'confirmed'].includes(r.status) && <button disabled={busy} onClick={() => setAction('cancelled')} className={`${button} text-red-500`}>Cancel</button>}
    </div>}
    {action === 'cancelled' && <div className="rounded-xl border border-current/15 p-3 space-y-3 max-w-sm">
      <p className="text-sm font-semibold">Cancel reservation{r.preorder ? ' and preorder' : ''}</p>
      <label className="block text-xs">Requested by<select aria-label="Cancellation requested by" value={actor} onChange={e => setActor(e.target.value)} className="mt-1 w-full rounded-lg border p-2 bg-white text-gray-900"><option value="customer">Customer (two-hour deadline; 5% fee)</option><option value="restaurant">Restaurant (full refund)</option></select></label>
      {paid && <p className="text-xs">Refund Rs {(amount - fee).toFixed(2)} · Fee Rs {fee.toFixed(2)}</p>}
      <textarea aria-label="Cancellation reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason / customer contact details" maxLength={500} className="w-full rounded-lg border p-2 text-xs text-gray-900 bg-white" />
      <div className="flex gap-2"><button disabled={busy} onClick={() => apply('cancelled')} className={`${button} text-red-500`}>Confirm cancellation</button><button onClick={() => setAction('')} className={button}>Back</button></div>
    </div>}
    {action === 'seated' && <div className="rounded-xl border border-current/15 p-3 space-y-3 max-w-sm">
      <p className="text-xs">Link this prepaid order to the arriving party’s dining session.</p>
      <select aria-label="Dining session" value={sessionMode} onChange={e => setSessionMode(e.target.value)} className="w-full rounded-lg border p-2 text-xs text-gray-900 bg-white"><option value="">Choose a session action</option><option value="new">Create a new session for this party</option><option value="existing">Link this party’s existing session</option></select>
      {sessionMode === 'existing' && <input aria-label="Session ID" type="number" min="1" value={sessionId} onChange={e => setSessionId(e.target.value)} placeholder="Session ID" className="w-full rounded-lg border p-2 text-xs text-gray-900 bg-white" />}
      <div className="flex gap-2"><button disabled={busy || !sessionMode || (sessionMode === 'existing' && !Number(sessionId))} onClick={() => apply('seated')} className={button}>Seat and link preorder</button><button onClick={() => setAction('')} className={button}>Back</button></div>
    </div>}
    {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
  </div>;
}
