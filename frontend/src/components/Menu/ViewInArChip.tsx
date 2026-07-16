interface ViewInArChipProps {
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export function ViewInArChip({ onClick, className = '' }: ViewInArChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 shadow-sm border border-violet-200 transition-colors hover:bg-violet-50 active:scale-95 ${className}`.trim()}
      aria-label="View in AR"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9-3v2.25m0 0V12m0-2.25h-2.25m4.5 0H15M9 18v2.25M9 18H6.75M9 18h2.25M15 18v2.25M15 18h2.25M15 18H12m-3-3.75h.008v.008H9v-.008z" />
      </svg>
      View in AR
    </button>
  );
}

export function ViewInArButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-sans font-semibold text-violet-800 transition-all hover:bg-violet-100 active:scale-[0.99]"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9-3v2.25m0 0V12m0-2.25h-2.25m4.5 0H15M9 18v2.25M9 18H6.75M9 18h2.25M15 18v2.25M15 18h2.25M15 18H12m-3-3.75h.008v.008H9v-.008z" />
      </svg>
      View in AR
    </button>
  );
}
