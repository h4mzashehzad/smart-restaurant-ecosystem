'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import type { tourSteps } from './tour-steps';
export function AdminTourCard({
  step,
  index,
  total,
  busy,
  error,
  onBack,
  onNext,
  onSkip,
}: {
  step: (typeof tourSteps)[number];
  index: number;
  total: number;
  busy: boolean;
  error: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [index]);
  return (
    <section
      role="region"
      aria-label="Interactive dashboard tour"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !busy) onSkip();
      }}
      className="fixed right-3 bottom-3 left-3 z-40 max-h-[46dvh] overflow-y-auto rounded-2xl border border-orange-200 bg-white p-5 text-gray-900 shadow-xl sm:right-5 sm:bottom-5 sm:left-auto sm:max-h-[65dvh] sm:w-96"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold tracking-wider text-orange-800 uppercase">
          Your restaurant, explained · {index + 1}/{total}
        </p>
        <button
          type="button"
          onClick={onSkip}
          disabled={busy}
          aria-label="Skip tour for now"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-orange-700"
        >
          <X size={17} />
        </button>
      </div>
      <div
        className="mt-2 mb-4 h-1 rounded-full bg-gray-100"
        role="progressbar"
        aria-label="Tour progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + 1}
      >
        <div
          className="h-full rounded-full bg-orange-600"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>
      <h2
        ref={title}
        tabIndex={-1}
        className="font-display text-xl font-semibold outline-none"
        aria-live="polite"
      >
        {step.label}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>
      <Link
        href={step.href}
        className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-orange-800 underline underline-offset-4"
      >
        Open {step.label}
      </Link>
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={busy || index === 0}
          onClick={onBack}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-orange-700 disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Back
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSkip}
          className="min-h-10 px-2 text-xs font-medium text-gray-500 focus-visible:outline-2 focus-visible:outline-orange-700"
        >
          Skip for now
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onNext}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-orange-700 px-4 text-xs font-semibold text-white hover:bg-orange-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : null}
          {index === total - 1 ? 'Finish' : 'Next'}
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
