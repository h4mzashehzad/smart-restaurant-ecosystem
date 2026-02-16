<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\FeedbackMenuItem;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FeedbackController extends Controller
{
    /**
     * Submit feedback for an order.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id'          => 'required|exists:restaurants,id',
            'order_id'               => 'required|exists:orders,id',
            'rating'                 => 'required|integer|min:1|max:5',
            'review_text'            => 'nullable|string|max:2000',
            'item_ratings'           => 'nullable|array',
            'item_ratings.*.menu_item_id' => 'required_with:item_ratings|exists:menu_items,id',
            'item_ratings.*.rating'  => 'required_with:item_ratings|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $feedback = Feedback::create([
            'restaurant_id' => $request->restaurant_id,
            'order_id'      => $request->order_id,
            'user_id'       => $request->user()->id,
            'rating'        => $request->rating,
            'review_text'   => $request->review_text,
        ]);

        // Create per-item ratings
        if ($request->has('item_ratings')) {
            foreach ($request->item_ratings as $itemRating) {
                FeedbackMenuItem::create([
                    'feedback_id'  => $feedback->id,
                    'menu_item_id' => $itemRating['menu_item_id'],
                    'item_rating'  => $itemRating['rating'],
                ]);
            }
        }

        // TODO: Send review text to ML sentiment analysis service asynchronously

        return response()->json([
            'success' => true,
            'message' => 'Feedback submitted',
            'data'    => $feedback->load('feedbackMenuItems'),
        ], 201);
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
