export const TOP_RATED_MIN_AVERAGE = 4.5;
export const TOP_RATED_MIN_REVIEWS = 5;

export function isTopRated(
  averageRating: number | string | null | undefined,
  reviewCount: number | null | undefined
): boolean {
  const avg = Number(averageRating);
  const count = Number(reviewCount ?? 0);
  return count >= TOP_RATED_MIN_REVIEWS && avg >= TOP_RATED_MIN_AVERAGE;
}

interface MenuItemRatingProps {
  averageRating: number | string | null | undefined;
  reviewCount?: number | null;
  /** Show muted "(N)" review count next to the score */
  showCount?: boolean;
  className?: string;
}

/**
 * Compact read-only rating: amber star + score.
 * Returns null when there are no reviews (hide entirely).
 */
export function MenuItemRating({
  averageRating,
  reviewCount = 0,
  showCount = true,
  className = '',
}: MenuItemRatingProps) {
  const count = Number(reviewCount ?? 0);
  if (count <= 0) return null;

  const score = parseFloat(String(averageRating ?? 0)).toFixed(1);

  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4 text-amber-400 shrink-0"
        aria-hidden
      >
        <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
      </svg>
      <span className="text-sm font-sans font-semibold text-gray-700">{score}</span>
      {showCount && (
        <span className="text-xs font-sans text-gray-400">({count})</span>
      )}
    </div>
  );
}

export function TopRatedBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 border border-amber-200 ${className}`.trim()}
    >
      Top Rated
    </span>
  );
}
