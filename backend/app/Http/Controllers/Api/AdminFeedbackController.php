<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Feedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminFeedbackController extends Controller
{
    use ResolvesRestaurant;

    /**
     * Paginated reviews for the authenticated restaurant with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $query = Feedback::where('restaurant_id', $restaurantId)
            ->with(['user', 'order', 'feedbackMenuItems.menuItem']);

        if ($request->filled('rating')) {
            $query->where('rating', $request->rating);
        }

        if ($request->filled('sentiment')) {
            $query->where('sentiment_label', $request->sentiment);
        }

        if ($request->has('flagged')) {
            $query->where('is_flagged', $request->boolean('flagged'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $feedback = $query->orderByDesc('created_at')->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $feedback,
        ]);
    }

    /**
     * Save (or update) the admin response to a review.
     */
    public function respond(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $feedback = Feedback::where('restaurant_id', $restaurantId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'admin_response' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $feedback->update([
            'admin_response' => $request->admin_response,
            'responded_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Response saved',
            'data' => $feedback->fresh(),
        ]);
    }

    /**
     * Unflag/dismiss a flagged review.
     */
    public function dismissFlag(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $feedback = Feedback::where('restaurant_id', $restaurantId)->findOrFail($id);

        $feedback->update([
            'is_flagged' => false,
            'flagged_reason' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Flag dismissed',
            'data' => $feedback->fresh(),
        ]);
    }
}
