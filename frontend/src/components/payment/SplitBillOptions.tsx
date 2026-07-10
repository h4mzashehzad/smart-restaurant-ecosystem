'use client';

export type SplitMode = 'full' | 'equal' | 'itemized';

interface SplitBillOptionsProps {
  total: number;
  participantCount: number;
  selected: SplitMode | null;
  onSelect: (mode: SplitMode) => void;
  busy?: boolean;
}

export function SplitBillOptions({
  total,
  participantCount,
  selected,
  onSelect,
  busy = false,
}: SplitBillOptionsProps) {
  const equalShare = participantCount > 0 ? total / participantCount : total;

  const options: {
    id: SplitMode;
    title: string;
    subtitle: string;
    icon: string;
  }[] = [
    {
      id: 'full',
      title: "I'll pay the full bill",
      subtitle: `Rs ${total.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`,
      icon: '1',
    },
    {
      id: 'equal',
      title: 'Split equally',
      subtitle: `Rs ${equalShare.toLocaleString('en-PK', { minimumFractionDigits: 2 })} each · ${participantCount} guests`,
      icon: '=',
    },
    {
      id: 'itemized',
      title: 'Split by items',
      subtitle: 'Everyone claims what they ordered',
      icon: '☰',
    },
  ];

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-sans text-gray-500 leading-relaxed">
        Choose how this table wants to settle. Everyone sees the same choice live.
      </p>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          disabled={busy}
          onClick={() => onSelect(opt.id)}
          className={`w-full text-left rounded-2xl border px-4 py-3.5 transition-all flex items-start gap-3 disabled:opacity-60 ${
            selected === opt.id
              ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/15 shadow-sm'
              : 'border-stone-200 bg-white hover:border-orange-300 hover:bg-orange-50/40'
          }`}
        >
          <span className="mt-0.5 w-8 h-8 rounded-xl bg-stone-900 text-white text-sm font-display font-bold flex items-center justify-center shrink-0">
            {opt.icon}
          </span>
          <span className="min-w-0">
            <span className="block font-sans font-semibold text-gray-900 text-sm">{opt.title}</span>
            <span className="block font-sans text-xs text-gray-500 mt-0.5">{opt.subtitle}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
