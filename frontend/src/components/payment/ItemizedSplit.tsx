'use client';

export interface ClaimableUnit {
  order_item_id: number;
  unit_index: number;
  amount: number;
  name: string;
  menu_item_id: number;
}

export interface ClaimRecord {
  order_item_id: number;
  unit_index: number;
  participant_id: number;
  amount: number;
}

interface ItemizedSplitProps {
  units: ClaimableUnit[];
  claims: ClaimRecord[];
  myParticipantId: number | null;
  onToggle: (unit: ClaimableUnit, action: 'claim' | 'unclaim') => void;
  busyKey?: string | null;
  participantLabel?: (participantId: number | null | undefined) => string;
}

export function ItemizedSplit({
  units,
  claims,
  myParticipantId,
  onToggle,
  busyKey,
  participantLabel,
}: ItemizedSplitProps) {
  const claimMap = new Map(claims.map((c) => [`${c.order_item_id}:${c.unit_index}`, c]));

  const myTotal = claims
    .filter((c) => c.participant_id === myParticipantId)
    .reduce((sum, c) => sum + c.amount, 0);

  const claimedCount = claims.length;
  const remaining = Math.max(units.length - claimedCount, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-sans text-gray-500">
          Tap to claim. Updates live for everyone at the table.
        </p>
        <span className="text-[11px] font-sans font-semibold text-stone-500 bg-stone-100 px-2 py-1 rounded-full shrink-0">
          {remaining} left
        </span>
      </div>
      <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-0.5">
        {units.length === 0 ? (
          <p className="text-sm text-gray-400 font-sans text-center py-8">Waiting for items…</p>
        ) : (
          units.map((unit) => {
            const key = `${unit.order_item_id}:${unit.unit_index}`;
            const claim = claimMap.get(key);
            const mine = claim?.participant_id === myParticipantId;
            const taken = !!claim && !mine;
            const busy = busyKey === key;
            const label = claim
              ? participantLabel?.(claim.participant_id) || `Guest ${claim.participant_id}`
              : null;

            return (
              <button
                key={key}
                type="button"
                disabled={taken || busy}
                onClick={() => onToggle(unit, mine ? 'unclaim' : 'claim')}
                className={`w-full flex items-center justify-between rounded-2xl border px-3.5 py-3 text-left transition-all ${
                  mine
                    ? 'border-orange-500 bg-orange-50 shadow-sm shadow-orange-500/10'
                    : taken
                      ? 'border-stone-100 bg-stone-100/80 opacity-70 cursor-not-allowed'
                      : 'border-stone-200 bg-white hover:border-orange-300 active:scale-[0.99]'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className={`text-sm font-sans font-medium truncate ${taken ? 'text-gray-400' : 'text-gray-900'}`}>
                    {unit.name}
                    {units.filter((u) => u.order_item_id === unit.order_item_id).length > 1 && (
                      <span className="text-gray-400 font-normal"> · #{unit.unit_index + 1}</span>
                    )}
                  </div>
                  {taken && (
                    <div className="text-[11px] text-gray-400 font-sans mt-0.5">Claimed by {label}</div>
                  )}
                  {mine && (
                    <div className="text-[11px] text-orange-600 font-sans mt-0.5 font-semibold">Your item</div>
                  )}
                </div>
                <div className={`text-sm font-sans font-semibold shrink-0 ${taken ? 'text-gray-400' : 'text-gray-800'}`}>
                  Rs {unit.amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </div>
              </button>
            );
          })
        )}
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-stone-100">
        <span className="text-sm font-sans text-gray-500">Your running total</span>
        <span className="text-base font-display font-bold text-orange-500">
          Rs {myTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
