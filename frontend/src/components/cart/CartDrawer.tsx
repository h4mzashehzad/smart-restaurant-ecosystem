'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Portal } from '@/components/Portal';
import { useCart } from '@/contexts/CartContext';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePayment } from '@/contexts/PaymentContext';
import { CartItem } from './CartItem';
import { OrderSuccess } from './OrderSuccess';
import { PaymentDrawer } from '@/components/payment/PaymentDrawer';
import { estimateLoyaltyDiscount, estimateLoyaltyTotals } from '@/lib/loyalty';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, itemCount, subtotal, taxAmount, total, specialInstructions, setInstructions, clearCart } = useCart();
  const { session } = useSession();
  const { user } = useAuth();
  const payment = usePayment();
  const router = useRouter();

  const [loyaltyDismissed, setLoyaltyDismissed] = useState(false);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Keep local payment drawer in sync with session-wide payment state
  useEffect(() => {
    if (payment.drawerOpen) {
      setPaymentOpen(true);
    }
  }, [payment.drawerOpen]);

  useEffect(() => {
    if (!open) {
      setError('');
      setLoyaltyDismissed(false);
      if (!payment.active && payment.step !== 'success') {
        setPaymentOpen(false);
      }
    }
  }, [open, payment.active, payment.step]);

  useEffect(() => {
    if (open || paymentOpen || payment.drawerOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [open, paymentOpen, payment.drawerOpen]);

  function handlePlaceOrder() {
    setError('');

    if (!session) {
      setError('Scan your table QR code first to place an order.');
      return;
    }

    if (payment.active) {
      payment.openPaymentDrawer();
      setPaymentOpen(true);
      return;
    }

    if (items.length === 0) return;
    payment.beginLocalCheckout();
    setPaymentOpen(true);
  }

  function handlePaid(orderNumber: string) {
    setSuccessOrder(orderNumber);
    setPaymentOpen(false);
    payment.closePaymentDrawer();
  }

  function handleSuccessDone() {
    clearCart();
    setSuccessOrder(null);
    payment.resetPayment();
    onClose();
  }

  function handleClosePayment() {
    setPaymentOpen(false);
    payment.closePaymentDrawer();
  }

  const showShell = open || paymentOpen || !!successOrder || payment.drawerOpen;
  if (!showShell) return null;

  const inPaymentFlow = paymentOpen || payment.drawerOpen;
  const loyaltyEstimate = user
    ? estimateLoyaltyDiscount(user.loyalty_tier, subtotal)
    : { amount: 0, percent: 0 };
  const loyaltyTotals =
    loyaltyEstimate.amount > 0
      ? estimateLoyaltyTotals(subtotal, loyaltyEstimate.amount)
      : { taxAmount, total };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (successOrder || payment.step === 'success') return;
          if (inPaymentFlow) {
            handleClosePayment();
            return;
          }
          onClose();
        }}
        aria-hidden="true"
      />

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70]">
        <div className="animate-slide-up bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90dvh]">
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {successOrder ? (
            <div className="overflow-y-auto flex-1">
              <OrderSuccess orderNumber={successOrder} onDone={handleSuccessDone} />
            </div>
          ) : inPaymentFlow ? (
            <div className="overflow-y-auto flex-1">
              <PaymentDrawer
                open={inPaymentFlow}
                onClose={handleClosePayment}
                cartItems={items.map((i) => ({
                  id: i.id,
                  quantity: i.quantity,
                  customizations: (i.customizations ?? []).map((c) => ({
                    ingredient_id: c.ingredient_id,
                    action: 'modify' as const,
                    quantity: c.quantity,
                  })),
                }))}
                specialInstructions={specialInstructions}
                subtotal={subtotal}
                taxAmount={loyaltyTotals.taxAmount}
                total={loyaltyTotals.total}
                onPaid={handlePaid}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-display font-bold text-gray-900">Your Cart</h2>
                  {itemCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors active:scale-95"
                  aria-label="Close cart"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {payment.active && (
                <div className="mx-4 mt-3 shrink-0 rounded-2xl border border-orange-200 bg-orange-50 px-3.5 py-3">
                  <p className="text-xs font-sans font-semibold text-orange-800">Table split in progress</p>
                  <p className="text-[11px] font-sans text-orange-700/80 mt-0.5">
                    Open checkout to claim items or pay your share.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      payment.openPaymentDrawer();
                      setPaymentOpen(true);
                    }}
                    className="mt-2 text-xs font-sans font-semibold text-orange-700 underline underline-offset-2"
                  >
                    Continue checkout
                  </button>
                </div>
              )}

              {!user && !loyaltyDismissed && (
                <div className="mx-4 mt-3 shrink-0 flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-3 py-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-500 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-sans font-semibold text-orange-700 leading-tight">Earn loyalty points</p>
                    <button
                      onClick={() => {
                        onClose();
                        router.push('/login?redirect=/menu');
                      }}
                      className="text-xs text-orange-500 font-sans underline underline-offset-2"
                    >
                      Log in to track rewards
                    </button>
                  </div>
                  <button
                    onClick={() => setLoyaltyDismissed(true)}
                    className="text-orange-300 hover:text-orange-500 transition-colors shrink-0"
                    aria-label="Dismiss"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {!session && (
                <div className="mx-4 mt-3 shrink-0 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-amber-500 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-xs font-sans text-amber-700 leading-tight">
                    Scan your table QR code to place an order.
                  </p>
                </div>
              )}

              <div className="overflow-y-auto flex-1 px-5">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gray-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                      </svg>
                    </div>
                    <p className="font-display font-bold text-gray-400 text-base">Your cart is empty</p>
                    <p className="text-sm text-gray-400 font-sans mt-1">
                      {payment.active
                        ? 'A table split is already underway — continue checkout above.'
                        : 'Add items from the menu to get started.'}
                    </p>
                  </div>
                ) : (
                  items.map((item) => <CartItem key={item.lineKey} item={item} />)
                )}
              </div>

              {(items.length > 0 || payment.active) && (
                <div className="px-5 pt-3 pb-5 border-t border-gray-100 shrink-0 bg-white space-y-4">
                  {items.length > 0 && (
                    <>
                      <div>
                        <label className="text-xs font-sans font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                          Special Instructions
                        </label>
                        <textarea
                          value={specialInstructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          placeholder="e.g. No onions, extra spicy…"
                          rows={2}
                          maxLength={500}
                          className="w-full text-sm font-sans text-gray-700 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-3 resize-none
                                     focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 transition-all placeholder:text-gray-300"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm font-sans text-gray-500">
                          <span>Subtotal</span>
                          <span>Rs {subtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {loyaltyEstimate.amount > 0 && (
                          <div className="flex justify-between text-sm font-sans text-emerald-600">
                            <span>Loyalty discount (−{loyaltyEstimate.percent}%)</span>
                            <span>
                              − Rs{' '}
                              {loyaltyEstimate.amount.toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-sans text-gray-500">
                          <span>Tax (12%)</span>
                          <span>
                            Rs{' '}
                            {loyaltyTotals.taxAmount.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between font-display font-bold text-gray-900 text-base pt-1.5 border-t border-gray-100">
                          <span>Total</span>
                          <span className="text-orange-500">
                            Rs{' '}
                            {loyaltyTotals.total.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {error && (
                    <p className="text-xs text-red-500 font-sans bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={items.length === 0 && !payment.active}
                    className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl
                               shadow-lg shadow-orange-500/25 hover:bg-orange-600
                               disabled:opacity-60 disabled:cursor-not-allowed
                               active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {payment.active
                      ? 'Continue split checkout'
                      : `Checkout · Rs ${loyaltyTotals.total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
