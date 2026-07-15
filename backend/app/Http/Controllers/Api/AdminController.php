<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Reservation;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    use ResolvesRestaurant;

    public function dashboardStats(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $todayOrders = Order::where('restaurant_id', $restaurantId)
            ->whereDate('placed_at', today())->count();

        $todayRevenue = Order::where('restaurant_id', $restaurantId)
            ->whereDate('placed_at', today())
            ->where('status', 'completed')
            ->sum('total_amount');

        $activeOrders = Order::where('restaurant_id', $restaurantId)
            ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
            ->count();

        $totalCustomers = Order::where('restaurant_id', $restaurantId)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        $pendingReservations = Reservation::where('restaurant_id', $restaurantId)
            ->where('status', 'pending')
            ->where('reservation_date', '>=', today())
            ->count();

        $avgRating = Feedback::where('restaurant_id', $restaurantId)->avg('rating');

        $openWaiterRequests = ServiceRequest::where('restaurant_id', $restaurantId)
            ->whereIn('status', ['pending', 'acknowledged', 'in_progress'])
            ->count();

        $flaggedReviews = Feedback::where('restaurant_id', $restaurantId)
            ->where('is_flagged', true)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'today_orders' => $todayOrders,
                'today_revenue' => round((float) $todayRevenue, 2),
                'active_orders' => $activeOrders,
                'total_customers' => $totalCustomers,
                'pending_reservations' => $pendingReservations,
                'average_rating' => round((float) ($avgRating ?? 0), 2),
                'open_waiter_requests' => $openWaiterRequests,
                'flagged_reviews' => $flaggedReviews,
            ],
        ]);
    }

    public function activeKitchenOrders(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $orders = Order::where('restaurant_id', $restaurantId)
            ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
            ->with(['items.menuItem', 'table', 'user'])
            ->orderBy('placed_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    public function updateMenuItem(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:150',
            'description' => 'sometimes|string',
            'base_price' => 'sometimes|numeric|min:0',
            'preparation_time' => 'sometimes|integer|min:0',
            'is_available' => 'sometimes|boolean',
            'is_vegetarian' => 'sometimes|boolean',
            'is_vegan' => 'sometimes|boolean',
            'is_gluten_free' => 'sometimes|boolean',
            'is_signature' => 'sometimes|boolean',
            'spice_level' => 'sometimes|in:none,mild,medium,hot,extra_hot',
            'image_url' => 'sometimes|nullable|url|max:500',
            'category_id' => 'sometimes|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $menuItem = MenuItem::where('restaurant_id', $restaurantId)->findOrFail($id);
        $menuItem->update($request->only($menuItem->getFillable()));

        return response()->json([
            'success' => true,
            'message' => 'Menu item updated',
            'data' => $menuItem->fresh('category'),
        ]);
    }
}
