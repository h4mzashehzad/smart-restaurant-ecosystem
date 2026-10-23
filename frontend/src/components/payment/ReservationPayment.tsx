'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';
import type { ReservationDraft } from '@/types/reservation';
import { BillSummary } from './BillSummary';

export function ReservationPayment({ reservation, onClose, subtotal, taxAmount, total, discount }: {
  reservation: ReservationDraft; onClose: () => void; subtotal: number; taxAmount: number; total: number; discount: number;
}) {
  const { items, specialInstructions } = useCart();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recoveryUrl, setRecoveryUrl] = useState('');

  async function pay() {
    if (!accepted || busy) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.http.post('/reservation-checkouts', {
        ...reservation, policy_accepted: accepted, payment_method: 'safepay', expected_total: total,
        special_instructions: specialInstructions,
        items: items.map(i => ({ menu_item_id: i.id, quantity: i.quantity,
          customizations: (i.customizations ?? []).map(c => ({ ingredient_id: c.ingredient_id, action: 'modify', quantity: c.quantity })) })),
      });
      const result = data.data;
      sessionStorage.setItem(`reservation-return:${result.reservation.confirmation_code}`, reservation.checkout_key);
      setRecoveryUrl(result.management_url);
      window.location.assign(result.checkout_url);
    } catch (cause: unknown) {
      const response = (cause as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
      setError(response?.errors ? Object.values(response.errors).flat().join(' ') : response?.message || 'Could not open Safepay. Please try again.');
      setBusy(false);
    }
  }

  return <div className="px-5 pb-6 pt-2 space-y-4 animate-[fadeIn_0.25s_ease]">
    <div className="flex items-center justify-between gap-3">
      <div><p className="text-[11px] uppercase tracking-[0.14em] font-sans font-semibold text-orange-500/80">Reservation checkout</p><h3 className="font-display text-lg font-bold text-gray-900">Checkout</h3></div>
      <button onClick={onClose} disabled={busy} className="rounded-xl px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">Back</button>
    </div>
    <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm space-y-1">
      <p className="font-semibold text-gray-900">{reservation.restaurantName} · Table {reservation.tableNumber}</p>
      <p className="text-gray-500">{reservation.reservation_date} at {reservation.reservation_time} ({reservation.timezone}) · {reservation.party_size} guests</p>
    </div>
    <BillSummary subtotal={subtotal} taxAmount={taxAmount} total={total} discount={discount} />
    <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900 space-y-2">
      <p className="font-semibold">Pay securely by card through Safepay</p>
      <p>Your reservation is confirmed after payment. Cancel your reservation and preorder at least 2 hours before arrival for a 95% refund to your card. A 5% cancellation fee is deducted.</p>
      <p>You will receive a cancellation link by email. You can also contact the restaurant to request cancellation.</p>
      <p>For a booking less than 2 hours away, the online cancellation window has already closed.</p>
    </div>
    <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
      <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-1 accent-orange-500" />
      <span>I accept the two-hour cancellation deadline and 5% cancellation fee, including that a booking within two hours cannot be cancelled online.</span>
    </label>
    {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
    {recoveryUrl && <a href={recoveryUrl} className="block text-sm text-orange-600 underline">Return to your reservation</a>}
    <button onClick={pay} disabled={!accepted || busy} className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/25 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
      {busy ? 'Opening Safepay…' : `Pay by card · Rs ${total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
    </button>
  </div>;
}
