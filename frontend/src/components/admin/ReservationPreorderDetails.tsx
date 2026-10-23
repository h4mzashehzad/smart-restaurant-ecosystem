'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { restaurantTime, type ReservationPreorder, type ReservationRefund } from '@/types/reservation';

export function ReservationPreorderDetails({ preorder, refunds = [], timezone = 'Asia/Karachi', onUpdated }: {
  preorder?: ReservationPreorder | null; refunds?: ReservationRefund[]; timezone?: string; onUpdated?: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!preorder) return <span className="text-xs opacity-60">Table only</span>;
  const payment = preorder.payments[0];
  async function reconcile(refund: ReservationRefund) {
    setBusy(true); setError('');
    try { await api.http.post(`/admin/reservation-refunds/${refund.id}/reconcile`); onUpdated?.(); }
    catch { setError('Could not verify refund with Safepay.'); }
    finally { setBusy(false); }
  }
  return <details className="min-w-52 max-w-sm text-xs whitespace-normal text-left">
    <summary className="cursor-pointer font-semibold text-orange-500">{payment?.paid_at ? 'Paid preorder' : 'Preorder — unpaid'} · {preorder.items.reduce((sum, i) => sum + i.quantity, 0)} items · {preorder.status.replaceAll('_', ' ')}</summary>
    <div className="space-y-2 pt-3">
      <p className="font-mono">{preorder.order_number}</p>
      {preorder.items.map(i => <div key={i.id}><p className="font-semibold">{i.quantity} × {i.item_name} · Rs {Number(i.total_price).toFixed(2)}</p>{i.customization_notes && <p className="opacity-60 mt-1">{i.customization_notes}</p>}</div>)}
      {preorder.special_instructions && <p>Food notes: {preorder.special_instructions}</p>}
      <p>Subtotal Rs {Number(preorder.subtotal).toFixed(2)} · Discount Rs {Number(preorder.discount_amount).toFixed(2)} · Tax Rs {Number(preorder.tax_amount).toFixed(2)}</p>
      <p className="font-semibold">Total Rs {Number(preorder.total_amount).toFixed(2)}</p>
      <p>Kitchen release: {restaurantTime(preorder.kitchen_release_at, timezone)} ({timezone})</p>
      {payment?.receipt_url && <a target="_blank" rel="noreferrer" href={payment.receipt_url} className="block text-orange-500 underline">Receipt</a>}
      {refunds.map(refund => <div key={refund.id} className="rounded-lg border border-current/15 p-2 space-y-1"><p>Refund Rs {(refund.amount_paisa / 100).toFixed(2)} · Fee Rs {(refund.fee_paisa / 100).toFixed(2)}</p><p className="capitalize">{refund.status.replaceAll('_', ' ')}</p>{refund.last_error && <p className="text-amber-600">{refund.last_error}</p>}{['failed', 'needs_review'].includes(refund.status) && <button disabled={busy} onClick={() => reconcile(refund)} className="text-orange-500 underline">Verify with Safepay{refund.status === 'failed' ? ' / retry rejected request' : ''}</button>}</div>)}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  </details>;
}
