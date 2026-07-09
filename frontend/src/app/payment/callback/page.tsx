'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { PaymentSuccess } from '@/components/payment/PaymentSuccess';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tracker = searchParams.get('tracker') || searchParams.get('beacon');
  const paymentIdStr = searchParams.get('payment_id');
  const cancelled = searchParams.get('cancelled');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (cancelled === '1') {
      setStatus('error');
      setErrorMessage('Payment was cancelled by the user.');
      return;
    }

    if (!tracker && !paymentIdStr) {
      setStatus('error');
      setErrorMessage('Invalid callback parameters. No tracker or payment ID found.');
      return;
    }

    processCallback();
  }, [tracker, paymentIdStr, cancelled]);

  async function processCallback() {
    try {
      const res = await api.handleSafepayCallback(tracker as string, paymentIdStr as string);
      if (res.success && res.data?.status === 'completed') {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(res.message || 'Payment verification failed.');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err?.response?.data?.message || 'Failed to communicate with payment server.');
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin mb-6" />
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-500 font-sans text-center">Please do not close this window...</p>
          </div>
        )}

        {status === 'success' && (
          <PaymentSuccess 
            paymentId={paymentIdStr ? parseInt(paymentIdStr) : null}
            paymentMethod="safepay"
            onDone={() => router.push('/')} // Go back to session/home
          />
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-red-600 font-sans text-center mb-8 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><div className="w-16 h-16 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin" /></div>}>
      <CallbackContent />
    </Suspense>
  );
}
