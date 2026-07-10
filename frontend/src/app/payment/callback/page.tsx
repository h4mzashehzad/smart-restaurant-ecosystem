'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [message, setMessage] = useState('Verifying payment…');
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const tracker = params.get('tracker');
    const cancelled = params.get('cancelled') === '1';

    async function run() {
      if (!tracker && !cancelled) {
        setOk(false);
        setMessage('Missing payment tracker.');
        return;
      }

      try {
        const res = await api.verifySafepayCallback(tracker || '', cancelled);
        if (res.success) {
          if (res.data?.all_paid) {
            clearCart();
            setOk(true);
            setMessage('Payment complete! Returning to menu…');
            setTimeout(() => router.push('/menu'), 1600);
          } else {
            setOk(true);
            setMessage('Your share is paid. Opening the split tracker…');
            // Resume split UI on menu so the other guests' shares stay visible.
            setTimeout(() => router.push('/menu?split=1'), 1200);
          }
        } else {
          setOk(false);
          setMessage(res.message || 'Payment not completed.');
          setTimeout(() => router.push('/menu?split=1'), 2200);
        }
      } catch (err: any) {
        setOk(false);
        setMessage(err?.response?.data?.message || 'Could not verify payment.');
        setTimeout(() => router.push('/menu?split=1'), 2200);
      }
    }

    run();
  }, [params, router, clearCart]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-lg p-8 text-center">
        <div
          className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
            ok === null ? 'bg-orange-100' : ok ? 'bg-emerald-100' : 'bg-red-100'
          }`}
        >
          {ok === null ? (
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          ) : ok ? (
            <span className="text-emerald-600 text-xl">✓</span>
          ) : (
            <span className="text-red-500 text-xl">!</span>
          )}
        </div>
        <p className="font-sans text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center">Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
