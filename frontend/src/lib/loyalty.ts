/** Client-side loyalty discount estimate (server remains source of truth at checkout). */

const TIER_RULES: Record<
  string,
  { percent: number; minSubtotal: number }
> = {
  bronze: { percent: 5, minSubtotal: 1000 },
  silver: { percent: 10, minSubtotal: 2000 },
  gold: { percent: 15, minSubtotal: 2000 },
};

export function estimateLoyaltyDiscount(
  tier: string | null | undefined,
  subtotal: number
): { amount: number; percent: number } {
  if (!tier) return { amount: 0, percent: 0 };
  const rule = TIER_RULES[tier.toLowerCase()];
  if (!rule || subtotal < rule.minSubtotal) return { amount: 0, percent: 0 };
  return {
    amount: Math.round(subtotal * (rule.percent / 100) * 100) / 100,
    percent: rule.percent,
  };
}

export function estimateLoyaltyTotals(subtotal: number, discount: number) {
  const taxable = Math.max(0, subtotal - discount);
  const taxAmount = Math.round(taxable * 0.12 * 100) / 100;
  return {
    taxAmount,
    total: Math.round((taxable + taxAmount) * 100) / 100,
  };
}
