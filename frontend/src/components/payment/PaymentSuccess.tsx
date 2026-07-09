'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface PaymentSuccessProps {
  paymentId: number | null;
  paymentMethod: string | null;
  onDone: () => void;
}

export function PaymentSuccess({ paymentId, paymentMethod, onDone }: PaymentSuccessProps) {
  const [downloading, setDownloading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    // If the payment is completed (e.g. safepay callback) we can fetch the receipt immediately.
    // If it's cash, it might be pending staff confirmation, so receipt isn't ready.
    if (paymentId && paymentMethod !== 'cash') {
      fetchReceiptUrl();
    }
  }, [paymentId]);

  async function fetchReceiptUrl() {
    try {
      const res = await api.getReceiptUrl(paymentId!);
      if (res.success && res.data?.url) {
        setReceiptUrl(res.data.url);
      }
    } catch (err) {
      console.error('Receipt not ready yet');
    }
  }

  async function handleDownloadReceipt() {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
      return;
    }

    setDownloading(true);
    try {
      const res = await api.getReceiptUrl(paymentId!);
      if (res.success && res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      alert('Receipt is still generating. Please try again in a few moments.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="animate-scale-in flex flex-col items-center justify-center pt-8 pb-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-green-500 blur-xl opacity-30 rounded-full" />
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center relative shadow-xl shadow-green-500/30">
          <svg className="w-12 h-12 text-white animate-check" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
        {paymentMethod === 'cash' ? 'Payment Pending' : 'Payment Successful!'}
      </h2>
      
      <p className="text-gray-500 font-sans text-center px-4 max-w-sm mb-8">
        {paymentMethod === 'cash' 
          ? 'Please hand over the cash to the staff. Your receipt will be generated once confirmed.'
          : 'Thank you for your payment. Your bill is settled.'}
      </p>

      {paymentId && (
        <button
          onClick={handleDownloadReceipt}
          disabled={downloading}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 hover:bg-gray-50 transition-all font-semibold text-gray-700 mb-4 active:scale-95"
        >
          {downloading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          Download Receipt
        </button>
      )}

      <button
        onClick={onDone}
        className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all active:scale-[0.98]"
      >
        Done
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes check {
          0% { stroke-dasharray: 0, 100; opacity: 0; }
          100% { stroke-dasharray: 100, 100; opacity: 1; }
        }
        .animate-check {
          animation: check 0.6s ease-out forwards;
        }
      `}} />
    </div>
  );
}
