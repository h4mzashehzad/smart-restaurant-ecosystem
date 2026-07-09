'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/contexts/SessionContext';

interface SplitBillOptionsProps {
  billData: any;
  onBack: () => void;
  onSplitSetupComplete: () => void;
}

export function SplitBillOptions({ billData, onBack, onSplitSetupComplete }: SplitBillOptionsProps) {
  const { session } = useSession();
  const [splitType, setSplitType] = useState<'equal' | 'itemized' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // We need to know participants to do an equal split setup
  const participantsCount = billData.participant_count || 1;
  const splitAmount = billData.remaining / participantsCount;

  async function handleEqualSplitSetup() {
    setLoading(true);
    setError('');
    try {
      // Fetch participants for the session
      // Wait, we need the participant IDs to setup the split bill
      // The API expects: { session_id, split_type, participants: [{ participant_id, payment_method, amount }] }
      // This means the "Host" configures it for everyone.
      // For now, let's just trigger a toast or navigate to an Itemized Split UI where host assigns items/amounts.
      // Since this is complex, we will show a placeholder or basic setup.
      alert('Equal split setup is complex as we need all participant IDs. Needs implementation in ItemizedSplit.');
      // onSplitSetupComplete();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to setup split bill.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-slide-up pt-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-display font-bold text-gray-900">Split Bill</h2>
      </div>

      <div className="space-y-4 mb-8">
        <button
          onClick={() => setSplitType('equal')}
          className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${splitType === 'equal' ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${splitType === 'equal' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <p className={`font-bold text-lg ${splitType === 'equal' ? 'text-orange-900' : 'text-gray-900'}`}>Split Equally</p>
              <p className="text-sm text-gray-500 mt-0.5">Rs {splitAmount.toLocaleString('en-PK', { minimumFractionDigits: 0 })} per person</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSplitType('itemized')}
          className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${splitType === 'itemized' ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${splitType === 'itemized' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            </div>
            <div>
              <p className={`font-bold text-lg ${splitType === 'itemized' ? 'text-orange-900' : 'text-gray-900'}`}>Split by Items</p>
              <p className="text-sm text-gray-500 mt-0.5">Choose who pays for what</p>
            </div>
          </div>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <button
        onClick={splitType === 'equal' ? handleEqualSplitSetup : undefined}
        disabled={!splitType || loading}
        className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-[0.98]"
      >
        {loading ? 'Processing...' : 'Continue'}
      </button>
    </div>
  );
}
