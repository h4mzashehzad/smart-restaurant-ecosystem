'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/contexts/SessionContext';
import { usePayment } from '@/contexts/PaymentContext';
import { BillSummary } from './BillSummary';
import { SplitBillOptions, type SplitMode } from './SplitBillOptions';
import { ItemizedSplit, type ClaimableUnit } from './ItemizedSplit';
import { PaymentStatusTracker, type TrackerPayment } from './PaymentStatusTracker';
import { PaymentSuccess } from './PaymentSuccess';

interface PaymentDrawerProps {
  open: boolean;
  onClose: () => void;
  cartItems: { id: number; quantity: number }[];
  specialInstructions: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  onPaid: (orderNumber: string) => void;
}

export function PaymentDrawer({
  open,
  onClose,
  cartItems,
  specialInstructions,
  subtotal,
  taxAmount,
  total,
  onPaid,
}: PaymentDrawerProps) {
  const { session, deviceId } = useSession();
  const payment = usePayment();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  const participants = session?.participants?.filter((p) => !p.left_at) ?? [];
  const multiUser = participants.length >= 2;
  const step = payment.step === 'idle' ? 'method' : payment.step;

  const displaySubtotal = payment.orderSubtotal || subtotal;
  const displayTax = payment.orderTax || taxAmount;
  const displayTotal = payment.orderTotal || total;

  // If a live split already exists, never strand the guest on full-bill checkout.
  useEffect(() => {
    if (!open) return;
    if (payment.payments.length > 0 && (step === 'method' || step === 'split-options')) {
      payment.setStep('tracker');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment.payments.length, step]);

  if (!open) return null;

  async function startFullPayment(selected: 'cash' | 'safepay') {
    if (!session) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.checkout({
        session_id: session.id,
        table_id: session.table_id,
        items: cartItems.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
        special_instructions: specialInstructions || null,
        mode: 'full',
        payment_method: selected,
        participant_id: payment.myParticipantId,
        device_id: deviceId,
      });

      const pay = res.data?.payment;
      payment.setPaymentId(pay?.id ?? null);
      payment.applyCheckoutResult({
        orderId: pay?.order_id ?? res.data?.order?.id,
        orderNumber: res.data?.order?.order_number ?? '',
        subtotal: Number(res.data?.order?.subtotal ?? displaySubtotal),
        tax: Number(res.data?.order?.tax_amount ?? displayTax),
        total: Number(res.data?.order?.total_amount ?? displayTotal),
      });

      if (selected === 'safepay' && res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }

      payment.setStep('waiting-cash');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  async function continueAfterSplitChoice(mode: SplitMode) {
    payment.setSplitMode(mode);
    if (mode === 'full') {
      payment.setStep('method');
      return;
    }

    if (!session) return;
    setBusy(true);
    setError('');
    try {
      // Join an already-running split if one exists for this session.
      const bill = await api.getSessionBill(session.id);
      const draft = bill.draft_order;
      const existingPayments = (bill.payments || [])
        .filter((p: any) => draft && p.order_id === draft.id && p.split_group_id)
        .map((p: any) => ({
          id: p.id,
          participant_id: p.participant_id,
          amount: Number(p.amount),
          status: p.status,
          payment_method: p.payment_method,
        }));

      if (draft && existingPayments.length > 0) {
        payment.applyCheckoutResult({
          orderId: draft.id,
          orderNumber: draft.order_number,
          subtotal: Number(draft.subtotal || 0),
          tax: Number(draft.tax_amount || 0),
          total: Number(draft.total_amount || 0),
          units: bill.claimable_units || [],
          claims: bill.claims || [],
          splitType: bill.split_type,
          payments: existingPayments,
        });
        payment.setStep('tracker');
        return;
      }

      const res = await api.checkout({
        session_id: session.id,
        table_id: session.table_id,
        items: cartItems.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
        special_instructions: specialInstructions || null,
        mode: mode === 'equal' ? 'split_equal' : 'split_itemized',
        participant_id: payment.myParticipantId,
        device_id: deviceId,
      });

      const order = res.data?.order;
      const reusedPayments = (res.data?.payments || []).map((p: any) => ({
        id: p.id,
        participant_id: p.participant_id,
        amount: Number(p.amount),
        status: p.status,
        payment_method: p.payment_method,
      }));

      payment.applyCheckoutResult({
        orderId: order.id,
        orderNumber: order.order_number,
        subtotal: Number(order.subtotal ?? displaySubtotal),
        tax: Number(order.tax_amount ?? displayTax),
        total: Number(order.total_amount ?? displayTotal),
        units: res.data?.claimable_units || [],
        claims: res.data?.claims || [],
        mode: res.data?.mode,
        splitType: res.data?.split_type,
        payments: reusedPayments,
      });

      if (reusedPayments.length > 0) {
        payment.setStep('tracker');
        return;
      }

      if (mode === 'equal') {
        const setup = await api.setupSplitBill({
          order_id: order.id,
          session_id: session.id,
          split_type: 'equal',
          participant_ids: participants.map((p) => p.id),
        });
        payment.setPayments(
          (setup.data?.payments || []).map((p: any) => ({
            id: p.id,
            participant_id: p.participant_id,
            amount: Number(p.amount),
            status: p.status,
            payment_method: p.payment_method,
          }))
        );
        payment.setStep('tracker');
      } else {
        payment.setStep('itemized');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not start split bill');
    } finally {
      setBusy(false);
    }
  }

  async function handleClaimToggle(unit: ClaimableUnit, action: 'claim' | 'unclaim') {
    if (!session || !payment.orderId) return;
    const key = `${unit.order_item_id}:${unit.unit_index}`;
    setBusyKey(key);
    setError('');
    try {
      const res = await api.claimSplitItem({
        order_id: payment.orderId,
        session_id: session.id,
        order_item_id: unit.order_item_id,
        unit_index: unit.unit_index,
        action,
        participant_id: payment.myParticipantId,
        device_id: deviceId,
      });
      payment.setClaims(res.data?.claims || []);
      if (res.data?.claimable_units) payment.setUnits(res.data.claimable_units);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not update claim');
    } finally {
      setBusyKey(null);
    }
  }

  async function lockItemizedSplit() {
    if (!session || !payment.orderId) return;
    const allClaimed =
      payment.units.length > 0 && payment.claims.length >= payment.units.length;
    if (!allClaimed) {
      setError('Everyone must claim all items before continuing');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const setup = await api.setupSplitBill({
        order_id: payment.orderId,
        session_id: session.id,
        split_type: 'itemized',
      });
      payment.setPayments(
        (setup.data?.payments || []).map((p: any) => ({
          id: p.id,
          participant_id: p.participant_id,
          amount: Number(p.amount),
          status: p.status,
          payment_method: p.payment_method,
        }))
      );
      payment.setStep('tracker');
      await payment.refreshBill({ openDrawer: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lock split failed — claim all items first');
    } finally {
      setBusy(false);
    }
  }

  async function unlockItemizedSplit() {
    if (!session || !payment.orderId) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.unlockSplitBill({
        order_id: payment.orderId,
        session_id: session.id,
      });
      payment.setPayments([]);
      payment.setClaims(res.data?.claims || []);
      if (res.data?.claimable_units) payment.setUnits(res.data.claimable_units);
      payment.setSplitMode('itemized');
      payment.setStep('itemized');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not go back to edit claims');
    } finally {
      setBusy(false);
    }
  }

  async function handleParticipantPay(payRow: TrackerPayment, payMethod: 'cash' | 'safepay') {
    setPayingId(payRow.id);
    setError('');
    try {
      const res = await api.participantCheckout({
        payment_id: payRow.id,
        payment_method: payMethod,
      });
      payment.setPaymentId(payRow.id);
      payment.setPayments((prev) =>
        prev.map((p) =>
          p.id === payRow.id
            ? { ...p, status: payMethod === 'safepay' ? 'processing' : 'pending', payment_method: payMethod }
            : p
        )
      );
      if (payMethod === 'safepay' && res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      await payment.refreshBill({ openDrawer: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Payment start failed');
    } finally {
      setPayingId(null);
    }
  }

  function handleSuccessDone() {
    onPaid(payment.orderNumber || 'ORD');
    payment.resetPayment();
    onClose();
  }

  const titles: Record<string, string> = {
    method: 'Checkout',
    'split-options': 'Split the bill',
    itemized: 'Claim your items',
    tracker: 'Pay your share',
    'waiting-cash': 'Cash pending',
    success: 'All set',
    processing: 'Processing',
  };

  return (
    <div className="px-5 pb-6 pt-2 space-y-4 animate-[fadeIn_0.25s_ease]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] font-sans font-semibold text-orange-500/80">
            Table checkout
          </p>
          <h3 className="font-display text-lg font-bold text-gray-900">{titles[step] || 'Checkout'}</h3>
        </div>
        {step !== 'success' && (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-400 font-sans hover:text-gray-600 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {step !== 'success' && step !== 'tracker' && step !== 'waiting-cash' && (
        <BillSummary subtotal={displaySubtotal} taxAmount={displayTax} total={displayTotal} />
      )}

      {error && (
        <p className="text-xs text-red-500 font-sans bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      {step === 'method' && (
        <div className="space-y-3">
          {payment.payments.length > 0 && (
            <button
              type="button"
              onClick={() => {
                payment.setStep('tracker');
                void payment.refreshBill({ openDrawer: true });
              }}
              className="w-full py-3.5 rounded-2xl border border-orange-300 bg-orange-50 text-orange-800 text-sm font-semibold"
            >
              Resume split payment
            </button>
          )}
          {multiUser && (
            <button
              type="button"
              onClick={() => payment.setStep('split-options')}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-orange-500 bg-white text-orange-700 text-sm font-semibold shadow-md shadow-orange-500/15 active:scale-[0.98] transition-all flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-9L21 12m0 0L16.5 16.5M21 12H7.5" />
                  </svg>
                </span>
                <span className="text-left leading-snug">
                  <span className="block">Split with {participants.length} guests</span>
                  <span className="block text-[11px] font-medium text-orange-500/80 mt-0.5">
                    Tap to choose equal or by items
                  </span>
                </span>
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" className="w-5 h-5 shrink-0 text-orange-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}
          <button
            type="button"
            disabled={busy || cartItems.length === 0}
            onClick={() => startFullPayment('cash')}
            className="w-full py-3.5 rounded-2xl bg-gray-900 text-white font-semibold disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            Pay with Cash
          </button>
          <button
            type="button"
            disabled={busy || cartItems.length === 0}
            onClick={() => startFullPayment('safepay')}
            className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-60 active:scale-[0.98] transition-transform"
          >
            Pay with Card
          </button>
        </div>
      )}

      {step === 'split-options' && (
        <div className="space-y-4">
          <SplitBillOptions
            total={displayTotal}
            participantCount={participants.length}
            selected={payment.splitMode}
            onSelect={(mode) => continueAfterSplitChoice(mode)}
            busy={busy}
          />
          <button
            type="button"
            onClick={() => payment.setStep('method')}
            className="text-sm text-gray-500 font-sans hover:text-gray-700"
          >
            Back
          </button>
        </div>
      )}

      {step === 'itemized' && (
        <div className="space-y-4">
          <ItemizedSplit
            units={payment.units}
            claims={payment.claims}
            myParticipantId={payment.myParticipantId}
            participantLabel={payment.participantLabel}
            onToggle={handleClaimToggle}
            busyKey={busyKey}
          />
          {(() => {
            const allClaimed =
              payment.units.length > 0 && payment.claims.length >= payment.units.length;
            const remaining = Math.max(payment.units.length - payment.claims.length, 0);
            return (
              <>
                {!allClaimed && payment.units.length > 0 && (
                  <p className="text-xs font-sans text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    {remaining} item{remaining === 1 ? '' : 's'} still unclaimed — everyone must claim
                    before continuing.
                  </p>
                )}
                <button
                  type="button"
                  disabled={busy || !allClaimed}
                  onClick={lockItemizedSplit}
                  className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold disabled:opacity-50 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform"
                >
                  {busy ? 'Locking…' : allClaimed ? 'Confirm claims & continue' : 'Claim all items to continue'}
                </button>
              </>
            );
          })()}
        </div>
      )}

      {step === 'tracker' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-stone-50 border border-stone-100 px-3.5 py-3 space-y-2">
            <p className="text-sm font-sans text-stone-600 leading-relaxed">
              Everyone pays their share. Kitchen gets the order once all payments are complete.
            </p>
            {displayTotal > 0 && (
              <p className="text-xs font-sans text-stone-400">
                Bill total · Rs {displayTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            )}
            {payment.myShare != null && (
              <p className="text-sm font-display font-bold text-orange-600">
                Your share · Rs {payment.myShare.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          {payment.payments.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 mx-auto border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-sans text-gray-500">Setting up equal split…</p>
            </div>
          ) : (
            <PaymentStatusTracker
              payments={payment.payments}
              myParticipantId={payment.myParticipantId}
              participantLabel={payment.participantLabel}
              onPay={handleParticipantPay}
              payingId={payingId}
            />
          )}
          {payment.canEditClaims && (
            <button
              type="button"
              disabled={busy}
              onClick={unlockItemizedSplit}
              className="w-full py-3 rounded-2xl border-2 border-stone-300 bg-white text-stone-700 text-sm font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {busy ? 'Going back…' : '← Edit claimed items'}
            </button>
          )}
        </div>
      )}

      {step === 'waiting-cash' && (
        <div className="text-center py-6 space-y-3">
          <div className="w-12 h-12 mx-auto border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-sm text-gray-600">
            Waiting for staff to confirm your cash payment on the kitchen display…
          </p>
        </div>
      )}

      {step === 'success' && (
        <PaymentSuccess
          orderNumber={payment.orderNumber || 'ORD'}
          amount={payment.myShare ?? displayTotal}
          receiptUrl={payment.receiptUrl}
          onDone={handleSuccessDone}
        />
      )}
    </div>
  );
}
