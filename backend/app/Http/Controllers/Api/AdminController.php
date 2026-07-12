<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Reservation;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function revenue(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $period = $request->input('period', 'daily');
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);

        [$periodSelect, $periodGroup] = match ($period) {
            'weekly' => ['YEARWEEK(placed_at)', 'YEARWEEK(placed_at)'],
            'monthly' => ['DATE_FORMAT(placed_at, "%Y-%m")', 'DATE_FORMAT(placed_at, "%Y-%m")'],
            default => ['DATE(placed_at)', 'DATE(placed_at)'],
        };

        $revenue = Order::where('restaurant_id', $restaurantId)
            ->where('status', 'completed')
            ->where('placed_at', '>=', $startDate)
            ->selectRaw("{$periodSelect} as period")
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('COUNT(*) as total_orders')
            ->selectRaw('AVG(total_amount) as avg_order_value')
            ->groupByRaw($periodGroup)
            ->orderBy('period')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $revenue,
        ]);
    }

    public function peakHours(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);

        $peakHours = Order::where('restaurant_id', $restaurantId)
            ->where('placed_at', '>=', now()->subDays($days))
            ->select([
                DB::raw('HOUR(placed_at) as hour'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total_amount) as revenue'),
            ])
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $peakHours,
        ]);
    }

    public function popularItems(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $limit = (int) $request->input('limit', 10);

        $popular = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.status', '!=', 'cancelled')
            ->select([
                'menu_items.id',
                'menu_items.name',
                'menu_items.base_price',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.total_price) as total_revenue'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count'),
            ])
            ->groupBy('menu_items.id', 'menu_items.name', 'menu_items.base_price')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $popular,
        ]);
    }

    public function sentimentSummary(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $summary = Feedback::where('restaurant_id', $restaurantId)
            ->whereNotNull('sentiment_label')
            ->select([
                'sentiment_label',
                DB::raw('COUNT(*) as count'),
                DB::raw('AVG(sentiment_score) as avg_score'),
                DB::raw('AVG(rating) as avg_rating'),
            ])
            ->groupBy('sentiment_label')
            ->get();

        $flagged = Feedback::where('restaurant_id', $restaurantId)
            ->where('is_flagged', true)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'sentiment_breakdown' => $summary,
                'flagged_reviews' => $flagged,
            ],
        ]);
    }

    public function wastageReport(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $lowStock = Ingredient::where('restaurant_id', $restaurantId)
            ->whereColumn('stock_quantity', '<=', 'minimum_threshold')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'low_stock_ingredients' => $lowStock,
                'total_low_stock' => $lowStock->count(),
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
