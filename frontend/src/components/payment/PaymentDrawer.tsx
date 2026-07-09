'use client';

import { useState, useEffect } from 'react';
import { Portal } from '@/components/Portal';
import { useSession } from '@/contexts/SessionContext';
import { api } from '@/lib/api';
import { BillSummary } from './BillSummary';
import { SplitBillOptions } from './SplitBillOptions';
import { PaymentSuccess } from './PaymentSuccess';

interface PaymentDrawerProps {
  open: boolean;
  onClose: () => void;
  // If an order was just created, we might want to refresh the bill
  onPaymentComplete?: () => void;
}

export function PaymentDrawer({ open, onClose, onPaymentComplete }: PaymentDrawerProps) {
  const { session } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [billData, setBillData] = useState<any>(null);
  const [view, setView] = useState<'summary' | 'method' | 'split' | 'processing' | 'success'>('summary');
  const [error, setError] = useState('');
  
  // Payment specifics
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'safepay' | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);

  useEffect(() => {
    if (open && session) {
      loadBill();
    } else {
      // Reset state on close
      setView('summary');
      setPaymentMethod(null);
      setError('');
      setPaymentId(null);
    }
  }, [open, session]);

  // Lock scroll
  useEffect(() => {
    if (open) {
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
  }, [open]);

  async function loadBill() {
    setLoading(true);
    try {
      const result = await api.getSessionBill(session!.id);
      setBillData(result.data);
      if (result.data.remaining === 0) {
        setView('success');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load bill.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFullCheckout() {
    if (!paymentMethod) {
      setError('Please select a payment method.');
      return;
    }

    if (!session) return;
    setError('');
    setView('processing');

    try {
      // For checkout, we actually don't pass cart_items here because they are already converted into an order.
      // Wait, our backend checkout requires cart_items?
      // Ah! Let's check PaymentController.php checkout method!
      // In PaymentController.php, checkout expects cart_items because it was designed before I changed the flow!
      
      // Let's modify the payload according to what the backend expects, or we need to update the backend.
      // Wait, let's look at the backend PaymentController::checkout again.
      // We'll update the backend to not require cart_items if we are just paying for the remaining bill.
      
      const payload = {
        session_id: session.id,
        payment_method: paymentMethod,
        amount: billData.remaining,
        payment_type: 'full',
      };
      
      const res = await api.checkout(payload as any);
      
      if (paymentMethod === 'cash') {
        setPaymentId(res.data.payment_id);
        setView('success');
        onPaymentComplete?.();
      } else {
        // Safepay - redirect to checkout URL
        window.location.href = res.data.checkout_url;
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to initiate payment.');
      setView('method');
    }
  }

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[90]">
        <div className="animate-slide-up bg-[#f8fafc] rounded-t-[2rem] shadow-2xl flex flex-col max-h-[95dvh] overflow-hidden border border-gray-200/50">
          
          <div className="flex justify-center pt-4 pb-2 shrink-0 bg-white">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
          </div>

          <div className="overflow-y-auto flex-1 bg-white px-6 pb-8 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Calculating bill...</p>
              </div>
            ) : view === 'summary' ? (
              <div className="animate-fade-in pt-4">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Settle Your Bill</h2>
                
                {billData && (
                  <BillSummary 
                    orders={billData.orders}
                    payments={billData.payments}
                    totalBill={billData.total_bill}
                    totalPaid={billData.total_paid}
                    remaining={billData.remaining}
                  />
                )}

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                {billData?.remaining > 0 && (
                  <div className="space-y-3 mt-8">
                    <button
                      onClick={() => setView('method')}
                      className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all active:scale-[0.98]"
                    >
                      Pay Full Amount (Rs {billData.remaining.toLocaleString('en-PK', { minimumFractionDigits: 0 })})
                    </button>
                    
                    {billData.participant_count > 1 && (
                      <button
                        onClick={() => setView('split')}
                        className="w-full py-4 bg-orange-50 text-orange-600 font-bold rounded-2xl border border-orange-200 hover:bg-orange-100 transition-all active:scale-[0.98]"
                      >
                        Split Bill Options
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : view === 'method' ? (
              <div className="animate-fade-in pt-4">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setView('summary')} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-display font-bold text-gray-900">Payment Method</h2>
                </div>

                <div className="bg-orange-50 text-orange-800 p-4 rounded-2xl mb-6 border border-orange-100">
                  <p className="text-sm font-medium">Amount to Pay</p>
                  <p className="text-3xl font-display font-bold mt-1">Rs {billData?.remaining.toLocaleString('en-PK', { minimumFractionDigits: 0 })}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {/* Safepay Option */}
                  <label className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'safepay' ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="payment_method" value="safepay" className="sr-only" onChange={() => setPaymentMethod('safepay')} />
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'safepay' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h.01" /></svg>
                      </div>
                      <div>
                        <p className={`font-bold ${paymentMethod === 'safepay' ? 'text-orange-900' : 'text-gray-900'}`}>Pay with Card</p>
                        <p className="text-xs text-gray-500 mt-0.5">Powered by Safepay</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'safepay' ? 'border-orange-500' : 'border-gray-300'}`}>
                      {paymentMethod === 'safepay' && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                    </div>
                  </label>

                  {/* Cash Option */}
                  <label className={`relative flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input type="radio" name="payment_method" value="cash" className="sr-only" onChange={() => setPaymentMethod('cash')} />
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                      </div>
                      <div>
                        <p className={`font-bold ${paymentMethod === 'cash' ? 'text-green-900' : 'text-gray-900'}`}>Pay with Cash</p>
                        <p className="text-xs text-gray-500 mt-0.5">Pay at the table</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-green-500' : 'border-gray-300'}`}>
                      {paymentMethod === 'cash' && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                    </div>
                  </label>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleFullCheckout}
                  disabled={!paymentMethod}
                  className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  Confirm Payment
                </button>
              </div>
            ) : view === 'split' ? (
              <SplitBillOptions 
                billData={billData} 
                onBack={() => setView('summary')} 
                onSplitSetupComplete={() => loadBill()}
              />
            ) : view === 'processing' ? (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="w-16 h-16 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mb-6" />
                <h3 className="text-xl font-display font-bold text-gray-900">Processing Payment...</h3>
                <p className="text-gray-500 mt-2">Please wait, do not close this window.</p>
              </div>
            ) : view === 'success' ? (
              <PaymentSuccess 
                paymentId={paymentId} 
                paymentMethod={paymentMethod} 
                onDone={() => {
                  onClose();
                  onPaymentComplete?.();
                }} 
              />
            ) : null}
          </div>
        </div>
      </div>
    </Portal>
  );
}
