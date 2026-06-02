<?php

namespace App\Http\Controllers\Api;

use App\Events\FeedbackFlagged;
use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\FeedbackMenuItem;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class FeedbackController extends Controller
{
    /**
     * Submit feedback for an order.
     *
     * Accessible to both authenticated users and guests.
     * After saving, calls the ML service to analyze each item's text
     * independently and flags the review if any item triggers the rules.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id'               => 'required|exists:restaurants,id',
            'order_id'                    => 'required|exists:orders,id',
            'rating'                      => 'required|integer|min:1|max:5',
            'review_text'                 => 'nullable|string|max:2000',
            'item_ratings'                => 'nullable|array',
            'item_ratings.*.menu_item_id' => 'required_with:item_ratings|exists:menu_items,id',
            'item_ratings.*.rating'       => 'required_with:item_ratings|integer|min:1|max:5',
            'item_ratings.*.review_text'  => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Support both authenticated and guest users
        $userId = auth('sanctum')->id();

        $feedback = Feedback::create([
            'restaurant_id' => $request->restaurant_id,
            'order_id'      => $request->order_id,
            'user_id'       => $userId,
            'rating'        => $request->rating,
            'review_text'   => $request->review_text,
        ]);

        // Create per-item ratings with review text
        if ($request->has('item_ratings')) {
            foreach ($request->item_ratings as $itemRating) {
                FeedbackMenuItem::create([
                    'feedback_id'      => $feedback->id,
                    'menu_item_id'     => $itemRating['menu_item_id'],
                    'item_rating'      => $itemRating['rating'],
                    'item_review_text' => $itemRating['review_text'] ?? null,
                ]);
            }
        }

        // ── Call ML service for per-item independent sentiment analysis ──

        $this->analyzeSentiment($feedback, $request->item_ratings ?? []);

        return response()->json([
            'success' => true,
            'message' => 'Feedback submitted',
            'data'    => $feedback->fresh()->load('feedbackMenuItems.menuItem'),
        ], 201);
    }

    /**
     * Call the ML batch endpoint to analyze each item's text independently.
     * Updates sentiment columns on both feedback and feedback_menu_items.
     * Broadcasts FeedbackFlagged if any item is flagged.
     */
    private function analyzeSentiment(Feedback $feedback, array $itemRatings): void
    {
        // Build per-item payload for the ML batch endpoint
        $itemsForMl = collect($itemRatings)
            ->map(fn ($ir) => [
                'id'     => $ir['menu_item_id'],
                'text'   => $ir['review_text'] ?? '',
                'rating' => $ir['rating'],
            ])->toArray();

        // Only call ML if there's text to analyze
        $hasOverallText = ! empty($feedback->review_text);
        $hasItemText    = collect($itemsForMl)->contains(fn ($i) => ! empty($i['text']));

        if (! $hasOverallText && ! $hasItemText) {
            return;
        }

        try {
            $mlResponse = Http::timeout(15)->post(
                config('services.ml.url') . '/api/ml/sentiment/analyze-batch',
                [
                    'feedback_id'    => $feedback->id,
                    'overall_text'   => $feedback->review_text ?? '',
                    'overall_rating' => $feedback->rating,
                    'items'          => $itemsForMl,
                ]
            );

            if (! $mlResponse->successful()) {
                Log::warning('ML sentiment service returned non-200', [
                    'feedback_id' => $feedback->id,
                    'status'      => $mlResponse->status(),
                ]);
                return;
            }

            $analysis = $mlResponse->json('analysis');

            // ── Update overall feedback sentiment ─────────────────────
            if ($overall = $analysis['overall'] ?? null) {
                $feedback->update([
                    'sentiment_score'      => $overall['sentiment_score'] ?? null,
                    'sentiment_label'      => $overall['sentiment_label'] ?? null,
                    'sentiment_confidence' => $overall['sentiment_confidence'] ?? null,
                ]);
            }

            // ── Update per-item sentiment data ────────────────────────
            foreach ($analysis['item_results'] ?? [] as $itemResult) {
                if ($itemResult['sentiment_score'] === null) {
                    continue; // No text was provided for this item
                }

                FeedbackMenuItem::where('feedback_id', $feedback->id)
                    ->where('menu_item_id', $itemResult['menu_item_id'])
                    ->update([
                        'item_sentiment_score' => $itemResult['sentiment_score'],
                        'item_sentiment_label' => $itemResult['sentiment_label'],
                        'item_is_flagged'      => $itemResult['should_flag'] ?? false,
                    ]);
            }

            // ── Flag overall if ANY item or overall text is flagged ───
            $anyFlagged = $analysis['any_flagged'] ?? false;

            if ($anyFlagged) {
                $feedback->update([
                    'is_flagged'     => true,
                    'flagged_reason' => implode('; ', $analysis['flag_reasons'] ?? []),
                ]);

                broadcast(new FeedbackFlagged(
                    $feedback->fresh()->load('user', 'order.table', 'feedbackMenuItems.menuItem')
                ));
            }
        } catch (\Exception $e) {
            // Graceful degradation — feedback is saved even if ML service is down
            Log::error('ML sentiment analysis failed', [
                'feedback_id' => $feedback->id,
                'error'       => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get feedback for a specific order.
     */
    public function show(int $orderId): JsonResponse
    {
        $feedback = Feedback::with(['feedbackMenuItems.menuItem', 'user'])
            ->where('order_id', $orderId)
            ->first();

        if (! $feedback) {
            return response()->json([
                'success' => false,
                'message' => 'No feedback found for this order',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $feedback,
        ]);
    }

    /**
     * Get reviews for a restaurant.
     */
    public function restaurantReviews(Restaurant $restaurant): JsonResponse
    {
        $reviews = Feedback::where('restaurant_id', $restaurant->id)
            ->with(['user', 'feedbackMenuItems.menuItem'])
            ->orderByDesc('created_at')
            ->paginate(15);

        $averageRating = Feedback::where('restaurant_id', $restaurant->id)->avg('rating');

        return response()->json([
            'success' => true,
            'data'    => [
                'reviews'        => $reviews,
                'average_rating' => round($averageRating, 2),
                'total_reviews'  => $reviews->total(),
            ],
        ]);
    }
}
