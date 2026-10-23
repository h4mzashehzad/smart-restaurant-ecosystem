'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { restaurantTime, type ManagedReservation } from '@/types/reservation';

function messageOf(cause: unknown): string {
  return (cause as { response?: { data?: { message?: string } } }).response?.data?.message || 'Could not update your reservation. Please try again.';
}

export function ReservationManagement({ code }: { code: string }) {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const returned = params.get('payment_return') === '1';
  const cancelledPayment = params.get('payment_cancelled') === '1';
  const [reservation, setReservation] = useState<ManagedReservation | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const root = `/reservation-management/${encodeURIComponent(code)}`;

  const refresh = useCallback(async (verify = false) => {
    const response = verify
      ? await api.http.post(`${root}/verify`, { token })
      : await api.http.get(root, { params: { token } });
    const data = response.data.data as ManagedReservation;
    setReservation(data);
    if (data.checkout_state === 'paid') {
      const draftKey = sessionStorage.getItem(`reservation-return:${code}`);
      if (draftKey) localStorage.removeItem(`reservation-cart:${data.restaurant.slug}:${draftKey}`);
    }
    return data;
  }, [root, token, code]);

  useEffect(() => {
    let alive = true;
    async function load() {
      try { await refresh(returned); } catch (cause) { if (alive) setError(messageOf(cause)); }
      finally { if (alive) setLoading(false); }
    }
    void load();
    const timer = setInterval(() => { if (alive) void refresh(false).catch(() => {}); }, 15000);
    return () => { alive = false; clearInterval(timer); };
  }, [refresh, returned]);

  async function cancel() {
    setBusy(true); setError('');
    try {
      const { data } = await api.http.post(`${root}/cancel`, { token });
      setReservation(data.data); setConfirmCancel(false);
    } catch (cause) { setError(messageOf(cause)); }
    finally { setBusy(false); }
  }

  async function resumePayment() {
    setBusy(true); setError('');
    try {
      const verified = await refresh(true);
      if (verified.checkout_state === 'paid') return;
      const { data } = await api.http.post(`${root}/checkout`, { token });
      window.location.assign(data.data.checkout_url);
    } catch (cause) { setError(messageOf(cause)); }
    finally { setBusy(false); }
  }

  if (loading) return <p className="p-12 text-center text-gray-500">Checking your reservation…</p>;
  const r = reservation;
  const timezone = r?.restaurant.timezone || 'Asia/Karachi';
  const payment = r?.preorder?.payments[0];
  const money = (value: number) => `Rs ${value.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

  return <main className="min-h-screen bg-gray-50 px-5 py-10"><div className="max-w-xl mx-auto space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-wider text-orange-500">{r?.restaurant.name || 'Your reservation'}</p><h1 className="font-display text-3xl font-bold text-gray-900 mt-2">{r?.status === 'cancelled' ? 'Reservation cancelled' : r?.status === 'confirmed' ? 'You’re booked in' : 'Your reservation'}</h1></div>
    {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
    {r && <>
      <section className="rounded-3xl border border-gray-100 bg-white p-6 space-y-3 shadow-sm">
        <p className="text-sm text-gray-500">Confirmation code <strong className="font-mono text-orange-600">{r.confirmation_code}</strong></p>
        <h2 className="font-display text-xl font-bold text-gray-900">{r.guest_name}</h2>
        <p className="text-gray-600">{restaurantTime(r.arrival_at, timezone)} ({timezone})</p>
        <p className="text-sm text-gray-500">Table {r.table?.table_number} · {r.party_size} guests</p>
        <p className="text-sm capitalize text-gray-600">Booking: {r.status.replaceAll('_', ' ')}{r.preorder ? ` · Payment: ${r.checkout_state}` : ''}</p>
        {r.checkout_state === 'pending' && <div className="space-y-3"><p className="text-sm text-amber-700">{cancelledPayment ? 'Safepay checkout was closed. Your reservation is not confirmed yet.' : 'Your card payment is awaiting verification.'}</p><button disabled={busy} onClick={resumePayment} className="rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white disabled:opacity-50">Verify or resume card payment</button></div>}
        {r.checkout_state === 'expired' && !payment?.paid_at && <p className="text-sm text-amber-700">Your checkout hold expired. If your card was charged, verification is still in progress; please contact the restaurant before paying again.</p>}
      </section>
      {r.preorder && <section className="rounded-3xl border border-gray-100 bg-white p-6 space-y-4 shadow-sm">
        <h2 className="font-display text-xl font-bold text-gray-900">Your food preorder</h2>
        {r.preorder.items.map(item => <div key={item.id} className="flex justify-between gap-4 border-b border-gray-100 pb-3"><div><p className="font-semibold text-gray-800">{item.quantity} × {item.item_name}</p>{item.customization_notes && <p className="text-xs text-gray-500 mt-1">{item.customization_notes}</p>}</div><p className="text-sm text-gray-600 whitespace-nowrap">{money(Number(item.total_price))}</p></div>)}
        <p className="font-bold text-orange-600">Total: {money(Number(r.preorder.total_amount))}</p>
        {r.preorder.special_instructions && <p className="text-sm text-gray-500">Food notes: {r.preorder.special_instructions}</p>}
        {payment?.paid_at && <p className="text-sm text-emerald-700">Paid by card through Safepay</p>}
        {payment?.receipt_url && <a href={payment.receipt_url} target="_blank" rel="noreferrer" className="block text-sm text-orange-600 underline">View payment receipt</a>}
      </section>}
      {r.refunds.map(refund => <section key={refund.id} className="rounded-2xl border border-orange-100 bg-orange-50 p-5 space-y-2 text-sm"><p className="font-semibold text-gray-900">Refund: {money(refund.amount_paisa / 100)}</p><p>Cancellation fee: {money(refund.fee_paisa / 100)}</p><p className="capitalize">Status: {refund.status.replaceAll('_', ' ')}</p>{['failed', 'needs_review'].includes(refund.status) && <p>Please contact the restaurant for help completing this refund.</p>}</section>)}
      {r.status !== 'cancelled' && <section className="rounded-3xl border border-gray-100 bg-white p-6 space-y-4 shadow-sm">
        <h2 className="font-display text-xl font-bold text-gray-900">Cancellation</h2>
        {r.preorder && <p className="text-sm text-gray-600">Cancel the reservation and food preorder at least two hours before arrival: {restaurantTime(r.cancellation_deadline, timezone)} ({timezone}). A {r.cancellation_fee_percent}% fee is deducted and {100 - r.cancellation_fee_percent}% is refunded to your card.</p>}
        {r.cancellation.allowed ? <>
          {confirmCancel ? <div className="space-y-3"><p className="text-sm font-semibold text-gray-800">Cancel this reservation{r.preorder ? ' and all preordered food' : ''}?</p>{payment?.paid_at && <p className="text-sm">Refund {money(r.cancellation.refund_paisa / 100)} · Fee {money(r.cancellation.fee_paisa / 100)}</p>}<div className="flex gap-3"><button disabled={busy} onClick={cancel} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Cancelling…' : 'Confirm cancellation'}</button><button disabled={busy} onClick={() => setConfirmCancel(false)} className="px-4 py-3 text-sm text-gray-500">Keep reservation</button></div></div>
          : <button onClick={() => setConfirmCancel(true)} className="text-sm font-semibold text-red-600 underline">Cancel reservation{r.preorder ? ' and preorder' : ''}</button>}
        </> : <p className="text-sm text-amber-700">Online cancellation is no longer available. Please contact the restaurant.</p>}
      </section>}
      <section className="px-2 text-sm text-gray-500 space-y-2"><p>You can also contact the restaurant to request cancellation.</p>{r.restaurant.phone && <a href={`tel:${r.restaurant.phone}`} className="block text-orange-600">{r.restaurant.phone}</a>}{r.restaurant.email && <a href={`mailto:${r.restaurant.email}`} className="block text-orange-600">{r.restaurant.email}</a>}<Link href={`/${r.restaurant.slug}/reserve`} className="block underline pt-3">Make another reservation</Link></section>
    </>}
  </div></main>;
}
