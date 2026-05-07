'use client';

import { useState } from 'react';
import { Portal } from '@/components/Portal';
import { useSession } from '@/contexts/SessionContext';

type RequestType = 'waiter_call' | 'bill_request' | 'water_refill' | 'cutlery' | 'complaint' | 'other';
type Priority    = 'low' | 'medium' | 'high';
type SubmitState = 'idle' | 'submitting' | 'sent' | 'error';

interface WaiterAssistanceDrawerProps {
  open: boolean;
  onClose: () => void;
}

const REQUEST_OPTIONS = [
  { type: 'waiter_call' as RequestType, label: 'Call Waiter',    desc: 'Get someone to your table',   path: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0' },
  { type: 'bill_request' as RequestType, label: 'Request Bill',  desc: 'Ready to settle up',           path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
  { type: 'water_refill' as RequestType, label: 'Water Refill',  desc: 'Bring more water please',      path: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z' },
  { type: 'cutlery' as RequestType,      label: 'Need Cutlery',  desc: 'Forks, spoons, knives',        path: 'M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37' },
  { type: 'complaint' as RequestType,    label: 'Complaint',     desc: 'Something needs attention',    path: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
  { type: 'other' as RequestType,        label: 'Other',         desc: 'Something else entirely',      path: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

const PRIORITY_OPTS = [
  { value: 'low' as Priority,    label: 'Low',    active: 'bg-gray-100 text-gray-600 border-gray-300' },
  { value: 'medium' as Priority, label: 'Medium', active: 'bg-amber-50 text-amber-700 border-amber-300' },
  { value: 'high' as Priority,   label: 'High',   active: 'bg-red-50 text-red-600 border-red-300' },
];

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending:      { label: 'Request sent — help is on the way!', color: 'text-amber-600' },
  acknowledged: { label: 'Acknowledged — waiter is coming!',   color: 'text-blue-600' },
  resolved:     { label: 'Resolved ? Thank you!',              color: 'text-green-600' },
};

export function WaiterAssistanceDrawer({ open, onClose }: WaiterAssistanceDrawerProps) {
  const { activeServiceRequests, submitWaiterRequest } = useSession();

  const [selected, setSelected]       = useState<RequestType | null>(null);
  const [message, setMessage]         = useState('');
  const [priority, setPriority]       = useState<Priority>('medium');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg]       = useState('');

  const latestRequest = activeServiceRequests[activeServiceRequests.length - 1] ?? null;

  function resetForm() { setSelected(null); setMessage(''); setPriority('medium'); setSubmitState('idle'); setErrorMsg(''); }
  function handleClose() { resetForm(); onClose(); }

  async function handleSubmit() {
    if (!selected) return;
    setSubmitState('submitting');
    try {
      await submitWaiterRequest(selected, message || undefined, priority);
      setSubmitState('sent');
    } catch {
      setErrorMsg('Could not send request. Please try again.');
      setSubmitState('error');
    }
  }

  if (!open) return null;

  const statusSteps = ['pending', 'acknowledged', 'resolved'];
  const currentIdx  = latestRequest ? statusSteps.indexOf(latestRequest.status) : -1;

  return (
    <Portal>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70]">
        <div className="animate-slide-up bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90dvh]">

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="text-xl font-display font-bold text-gray-900">Need Assistance?</h2>
              <p className="text-xs text-gray-400 font-sans mt-0.5">We'll send someone right over.</p>
            </div>
            <button onClick={handleClose} aria-label="Close assistance panel"
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors active:scale-95">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

            {/* Live status track */}
            {latestRequest && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Latest Request</p>
                <p className={`text-sm font-semibold ${STATUS_INFO[latestRequest.status]?.color ?? 'text-gray-700'}`}>
                  {STATUS_INFO[latestRequest.status]?.label ?? latestRequest.status}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  {statusSteps.map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500
                      ${i <= currentIdx ? 'bg-orange-400' : 'bg-gray-200'}`} />
                  ))}
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500
                    ${currentIdx >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {currentIdx >= 2 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Success state */}
            {submitState === 'sent' && (
              <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm font-semibold text-green-700">? Request sent! A waiter will be with you shortly.</p>
                <button onClick={resetForm} className="mt-2 text-xs text-orange-500 underline underline-offset-2 font-medium">
                  Send another request
                </button>
              </div>
            )}

            {submitState !== 'sent' && (
              <>
                {/* Option Grid */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What do you need?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {REQUEST_OPTIONS.map((opt) => {
                      const isActive = selected === opt.type;
                      return (
                        <button key={opt.type} id={`waiter-opt-${opt.type}`} onClick={() => setSelected(isActive ? null : opt.type)}
                          className={`flex flex-col items-start gap-2 rounded-2xl border-2 px-3.5 py-3 text-left
                                      transition-all duration-150 active:scale-[0.97] cursor-pointer
                                      ${isActive ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                            className={`w-6 h-6 ${isActive ? 'text-orange-500' : 'text-gray-400'} transition-colors`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={opt.path} />
                          </svg>
                          <div>
                            <p className={`text-sm font-bold font-display leading-tight ${isActive ? 'text-orange-600' : 'text-gray-800'}`}>{opt.label}</p>
                            <p className="text-[11px] text-gray-400 font-sans mt-0.5">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message + Priority */}
                {selected && (
                  <div className="space-y-3 animate-fade-in-up">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        Additional Note <span className="font-normal normal-case">(optional)</span>
                      </label>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                        placeholder="e.g. Sparkling water please…" rows={2}
                        className="w-full text-sm font-sans text-gray-700 bg-gray-50 border border-gray-200 rounded-2xl
                                   px-3.5 py-3 resize-none focus:outline-none focus:border-orange-400 focus:ring-2
                                   focus:ring-orange-500/15 transition-all placeholder:text-gray-300" />
                      <p className="text-right text-[10px] text-gray-300 mt-0.5">{message.length}/200</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Priority</label>
                      <div className="flex gap-2">
                        {PRIORITY_OPTS.map((p) => (
                          <button key={p.value} onClick={() => setPriority(p.value)}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer
                                        ${priority === p.value ? p.active : 'bg-white text-gray-400 border-gray-200'}`}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(submitState === 'error') && (
                      <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{errorMsg}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer CTA */}
          {submitState !== 'sent' && (
            <div className="px-5 pb-6 pt-3 border-t border-gray-100 shrink-0">
              <button id="waiter-submit-btn" onClick={handleSubmit} disabled={!selected || submitState === 'submitting'}
                className="w-full py-3.5 bg-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/25
                           hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all
                           flex items-center justify-center gap-2">
                {submitState === 'submitting' ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Sending…</>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    Request Assistance
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
