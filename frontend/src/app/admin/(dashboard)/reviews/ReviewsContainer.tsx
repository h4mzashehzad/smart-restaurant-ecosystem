'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, Flag } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { PageHeader } from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { ErrorState } from '@/components/admin/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ReviewsContainer() {
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'reviews', flaggedOnly],
    queryFn: () => adminApi.getReviews(flaggedOnly ? { flagged: true } : undefined),
  });

  const reviews = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description="Customer feedback and flagged reviews."
        actions={
          <Button
            size="sm"
            variant={flaggedOnly ? 'default' : 'outline'}
            onClick={() => setFlaggedOnly((v) => !v)}
          >
            <Flag className="h-3.5 w-3.5" />
            Flagged only
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load reviews." />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Customer feedback will appear here once orders are reviewed."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className={review.is_flagged ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}>
              <CardContent className="space-y-2 py-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  {review.is_flagged && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                      <Flag className="h-3 w-3" />
                      Flagged
                    </span>
                  )}
                </div>
                {review.review_text && <p className="text-sm text-gray-700">{review.review_text}</p>}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{review.user?.name ?? 'Anonymous'}</span>
                  <span>{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
