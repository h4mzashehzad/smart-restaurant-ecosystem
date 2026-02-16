<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Feedback;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * Dashboard overview stats.
     */
    public function dashboardStats(Request $request): JsonResponse
    {
        $restaurantId = $request->input('restaurant_id', 1);

        $todayOrders  = Order::where('restaurant_id', $restaurantId)
            ->whereDate('placed_at', today())->count();

        $todayRevenue = Order::where('restaurant_id', $restaurantId)
            ->whereDate('placed_at', today())
            ->where('status', 'completed')
            ->sum('total_amount');

        $activeOrders = Order::where('restaurant_id', $restaurantId)
            ->whereIn('status', ['pending', 'confirmed', 'preparing'])
            ->count();

        $totalCustomers = User::where('role', 'customer')->count();

        $pendingReservations = Reservation::where('restaurant_id', $restaurantId)
            ->where('status', 'pending')
            ->where('reservation_date', '>=', today())
            ->count();

        $avgRating = Feedback::where('restaurant_id', $restaurantId)->avg('rating');

        return response()->json([
            'success' => true,
            'data'    => [
                'today_orders'         => $todayOrders,
                'today_revenue'        => round($todayRevenue, 2),
                'active_orders'        => $activeOrders,
                'total_customers'      => $totalCustomers,
                'pending_reservations' => $pendingReservations,
                'average_rating'       => round($avgRating ?? 0, 2),
            ],
        ]);
    }

    /**
     * Revenue analytics (daily, weekly, monthly).
     */
    public function revenue(Request $request): JsonResponse
    {
        $restaurantId = $request->input('restaurant_id', 1);
        $period       = $request->input('period', 'daily'); // daily, weekly, monthly
        $days         = $request->input('days', 30);

        $startDate = now()->subDays($days);

        $groupBy = match ($period) {
            'weekly'  => DB::raw('YEARWEEK(placed_at)'),
            'monthly' => DB::raw('DATE_FORMAT(placed_at, "%Y-%m")'),
            default   => DB::raw('DATE(placed_at)'),
        };

        $revenue = Order::where('restaurant_id', $restaurantId)
            ->where('status', 'completed')
            ->where('placed_at', '>=', $startDate)
            ->select([
                $groupBy->getValue(DB::connection()->getQueryGrammar()) . ' as period',
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('AVG(total_amount) as avg_order_value'),
            ])
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $revenue,
        ]);
    }

    /**
     * Peak hours analysis.
     */
    public function peakHours(Request $request): JsonResponse
    {
        $restaurantId = $request->input('restaurant_id', 1);
        $days         = $request->input('days', 30);

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
            'data'    => $peakHours,
        ]);
    }

    /**
     * Popular items analysis.
     */
    public function popularItems(Request $request): JsonResponse
    {
        $restaurantId = $request->input('restaurant_id', 1);
        $limit        = $request->input('limit', 10);

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
            'data'    => $popular,
        ]);
    }

    /**
     * Sentiment analysis summary from feedback.
     */
    public function sentimentSummary(Request $request): JsonResponse
    {
        $restaurantId = $request->input('restaurant_id', 1);

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
            'data'    => [
                'sentiment_breakdown' => $summary,
                'flagged_reviews'     => $flagged,
            ],
        ]);
    }

    /**
     * Wastage / low-stock report based on ingredient thresholds.
     */
    public function wastageReport(Request $request): JsonResponse
    {
        $restaurantId = $request->input('restaurant_id', 1);

        $lowStock = \App\Models\Ingredient::where('restaurant_id', $restaurantId)
            ->whereColumn('stock_quantity', '<=', 'minimum_threshold')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'low_stock_ingredients' => $lowStock,
                'total_low_stock'       => $lowStock->count(),
            ],
        ]);
    }

    /**
     * Get active kitchen orders.
     */
    public function activeKitchenOrders(Request $request): JsonResponse
    {
        $restaurantId = $request->input('restaurant_id', 1);

        $orders = Order::where('restaurant_id', $restaurantId)
            ->whereIn('status', ['pending', 'confirmed', 'preparing'])
            ->with(['items.menuItem', 'table', 'user'])
            ->orderBy('placed_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $orders,
        ]);
    }

    /**
     * Update a menu item (admin).
     */
    public function updateMenuItem(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'             => 'sometimes|string|max:150',
            'description'      => 'sometimes|string',
            'base_price'       => 'sometimes|numeric|min:0',
            'preparation_time' => 'sometimes|integer|min:0',
            'is_available'     => 'sometimes|boolean',
            'is_vegetarian'    => 'sometimes|boolean',
            'is_vegan'         => 'sometimes|boolean',
            'is_gluten_free'   => 'sometimes|boolean',
            'spice_level'      => 'sometimes|in:none,mild,medium,hot,extra_hot',
            'image_url'        => 'sometimes|url|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $menuItem = MenuItem::findOrFail($id);
        $menuItem->update($request->only($menuItem->getFillable()));

        return response()->json([
            'success' => true,
            'message' => 'Menu item updated',
            'data'    => $menuItem->fresh(),
        ]);
    }
}
