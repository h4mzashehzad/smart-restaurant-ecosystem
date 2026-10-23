<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\DemandForecast;
use App\Models\Feedback;
use App\Models\FeedbackMenuItem;
use App\Models\Ingredient;
use App\Models\LoyaltyTransaction;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    use ResolvesRestaurant;

    private function isSqlite(): bool
    {
        return DB::getDriverName() === 'sqlite';
    }

    /** MySQL DAYOFWEEK (1=Sun…7=Sat) equivalent. */
    private function dayOfWeekExpr(string $column): string
    {
        return $this->isSqlite()
            ? "(CAST(strftime('%w', {$column}) AS INTEGER) + 1)"
            : "DAYOFWEEK({$column})";
    }

    private function hourExpr(string $column): string
    {
        return $this->isSqlite()
            ? "CAST(strftime('%H', {$column}) AS INTEGER)"
            : "HOUR({$column})";
    }

    private function minutesBetweenExpr(string $from, string $to): string
    {
        return $this->isSqlite()
            ? "AVG((julianday({$to}) - julianday({$from})) * 24 * 60)"
            : "AVG(TIMESTAMPDIFF(MINUTE, {$from}, {$to}))";
    }

    public function revenue(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $period = $request->input('period', 'daily');
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);

        if ($this->isSqlite()) {
            [$periodSelect, $periodGroup] = match ($period) {
                'weekly' => ["strftime('%Y-%W', placed_at)", "strftime('%Y-%W', placed_at)"],
                'monthly' => ["strftime('%Y-%m', placed_at)", "strftime('%Y-%m', placed_at)"],
                default => ['date(placed_at)', 'date(placed_at)'],
            };
        } else {
            [$periodSelect, $periodGroup] = match ($period) {
                'weekly' => ['YEARWEEK(placed_at)', 'YEARWEEK(placed_at)'],
                'monthly' => ['DATE_FORMAT(placed_at, "%Y-%m")', 'DATE_FORMAT(placed_at, "%Y-%m")'],
                default => ['DATE(placed_at)', 'DATE(placed_at)'],
            };
        }

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

    public function revenueByCategory(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);

        $rows = OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->join('categories', 'menu_items.category_id', '=', 'categories.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.status', 'completed')
            ->where('orders.placed_at', '>=', $startDate)
            ->select([
                'categories.id as category_id',
                'categories.name as category_name',
                DB::raw('SUM(order_items.total_price) as total_revenue'),
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count'),
            ])
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total_revenue')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    public function peakHours(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);

        $dayExpr = $this->dayOfWeekExpr('placed_at');
        $hourExpr = $this->hourExpr('placed_at');

        $peakHours = Order::where('restaurant_id', $restaurantId)
            ->where('placed_at', '>=', now()->subDays($days))
            ->where('status', '!=', 'cancelled')
            ->select([
                DB::raw("{$dayExpr} as day_of_week"),
                DB::raw("{$hourExpr} as hour"),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total_amount) as revenue'),
            ])
            ->groupByRaw("{$dayExpr}, {$hourExpr}")
            ->orderBy('day_of_week')
            ->orderBy('hour')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $peakHours,
        ]);
    }

    public function busiestTables(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);
        $limit = (int) $request->input('limit', 10);

        $tables = Order::query()
            ->join('tables', 'orders.table_id', '=', 'tables.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.status', 'completed')
            ->where('orders.placed_at', '>=', now()->subDays($days))
            ->whereNotNull('orders.table_id')
            ->select([
                'tables.id as table_id',
                'tables.table_number',
                DB::raw('COUNT(orders.id) as order_count'),
                DB::raw('SUM(orders.total_amount) as total_revenue'),
            ])
            ->groupBy('tables.id', 'tables.table_number')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tables,
        ]);
    }

    public function popularItems(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $limit = (int) $request->input('limit', 10);
        $days = (int) $request->input('days', 30);

        $popular = OrderItem::join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.status', '!=', 'cancelled')
            ->where('orders.placed_at', '>=', now()->subDays($days))
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

    public function menuPerformance(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);

        $categories = Category::query()
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->withCount([
                'menuItems as active_item_count' => fn ($q) => $q->where('is_available', true),
            ])
            ->get(['id', 'name']);

        $categoryStats = OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('menu_items', 'order_items.menu_item_id', '=', 'menu_items.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.status', 'completed')
            ->where('orders.placed_at', '>=', $startDate)
            ->select([
                'menu_items.category_id',
                DB::raw('SUM(order_items.total_price) as total_revenue'),
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count'),
            ])
            ->groupBy('menu_items.category_id')
            ->get()
            ->keyBy('category_id');

        $avgRatings = MenuItem::query()
            ->where('restaurant_id', $restaurantId)
            ->select([
                'category_id',
                DB::raw('AVG(average_rating) as avg_rating'),
            ])
            ->groupBy('category_id')
            ->pluck('avg_rating', 'category_id');

        $categoryPerformance = $categories->map(function (Category $category) use ($categoryStats, $avgRatings) {
            $stats = $categoryStats->get($category->id);

            return [
                'category_id' => $category->id,
                'category_name' => $category->name,
                'active_item_count' => (int) $category->active_item_count,
                'total_revenue' => round((float) ($stats->total_revenue ?? 0), 2),
                'total_quantity' => (int) ($stats->total_quantity ?? 0),
                'order_count' => (int) ($stats->order_count ?? 0),
                'avg_rating' => round((float) ($avgRatings[$category->id] ?? 0), 2),
            ];
        })->values();

        $itemOrderCounts = OrderItem::query()
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.restaurant_id', $restaurantId)
            ->where('orders.status', '!=', 'cancelled')
            ->where('orders.placed_at', '>=', $startDate)
            ->select([
                'order_items.menu_item_id',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.total_price) as total_revenue'),
            ])
            ->groupBy('order_items.menu_item_id')
            ->get()
            ->keyBy('menu_item_id');

        $itemSentiment = FeedbackMenuItem::query()
            ->join('feedback', 'feedback_menu_items.feedback_id', '=', 'feedback.id')
            ->where('feedback.restaurant_id', $restaurantId)
            ->where('feedback.created_at', '>=', $startDate)
            ->whereNotNull('feedback_menu_items.item_sentiment_label')
            ->select([
                'feedback_menu_items.menu_item_id',
                DB::raw('AVG(feedback_menu_items.item_sentiment_score) as avg_sentiment_score'),
                DB::raw('AVG(feedback_menu_items.item_rating) as avg_item_rating'),
                DB::raw('COUNT(*) as review_count'),
            ])
            ->groupBy('feedback_menu_items.menu_item_id')
            ->get()
            ->keyBy('menu_item_id');

        $underperforming = MenuItem::query()
            ->where('restaurant_id', $restaurantId)
            ->where('is_available', true)
            ->get(['id', 'name', 'base_price', 'category_id', 'average_rating', 'total_orders'])
            ->map(function (MenuItem $item) use ($itemOrderCounts, $itemSentiment) {
                $orders = $itemOrderCounts->get($item->id);
                $sentiment = $itemSentiment->get($item->id);
                $quantity = (int) ($orders->total_quantity ?? 0);
                $avgSentiment = $sentiment ? (float) $sentiment->avg_sentiment_score : null;
                $reviewCount = (int) ($sentiment->review_count ?? 0);

                $isLowVolume = $quantity <= 3;
                $isNegativeSentiment = $avgSentiment !== null && $avgSentiment < -0.1 && $reviewCount >= 2;

                if (! $isLowVolume && ! $isNegativeSentiment) {
                    return null;
                }

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'base_price' => (float) $item->base_price,
                    'category_id' => $item->category_id,
                    'total_quantity' => $quantity,
                    'total_revenue' => round((float) ($orders->total_revenue ?? 0), 2),
                    'avg_sentiment_score' => $avgSentiment !== null ? round($avgSentiment, 4) : null,
                    'avg_item_rating' => $sentiment ? round((float) $sentiment->avg_item_rating, 2) : null,
                    'review_count' => $reviewCount,
                    'reasons' => array_values(array_filter([
                        $isLowVolume ? 'low_order_frequency' : null,
                        $isNegativeSentiment ? 'negative_sentiment' : null,
                    ])),
                ];
            })
            ->filter()
            ->sortBy('total_quantity')
            ->values()
            ->take(15);

        return response()->json([
            'success' => true,
            'data' => [
                'categories' => $categoryPerformance,
                'underperforming_items' => $underperforming,
            ],
        ]);
    }

    public function sentimentSummary(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);

        $base = Feedback::where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', $startDate);

        $summary = (clone $base)
            ->whereNotNull('sentiment_label')
            ->select([
                'sentiment_label',
                DB::raw('COUNT(*) as count'),
                DB::raw('AVG(sentiment_score) as avg_score'),
                DB::raw('AVG(rating) as avg_rating'),
            ])
            ->groupBy('sentiment_label')
            ->get();

        $flagged = (clone $base)->where('is_flagged', true)->count();
        $totalReviews = (clone $base)->count();
        $responded = (clone $base)->whereNotNull('admin_response')->count();

        $trendDateExpr = $this->isSqlite() ? 'date(created_at)' : 'DATE(created_at)';

        $trend = (clone $base)
            ->whereNotNull('sentiment_label')
            ->select([
                DB::raw("{$trendDateExpr} as date"),
                'sentiment_label',
                DB::raw('COUNT(*) as count'),
            ])
            ->groupByRaw("{$trendDateExpr}, sentiment_label")
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'sentiment_breakdown' => $summary,
                'flagged_reviews' => $flagged,
                'total_reviews' => $totalReviews,
                'responded_reviews' => $responded,
                'response_rate' => $totalReviews > 0
                    ? round(($responded / $totalReviews) * 100, 1)
                    : 0.0,
                'trend' => $trend,
            ],
        ]);
    }

    public function sentimentByItem(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);
        $limit = (int) $request->input('limit', 15);

        $items = FeedbackMenuItem::query()
            ->join('feedback', 'feedback_menu_items.feedback_id', '=', 'feedback.id')
            ->join('menu_items', 'feedback_menu_items.menu_item_id', '=', 'menu_items.id')
            ->where('feedback.restaurant_id', $restaurantId)
            ->where('feedback.created_at', '>=', now()->subDays($days))
            ->whereNotNull('feedback_menu_items.item_sentiment_label')
            ->select([
                'menu_items.id',
                'menu_items.name',
                DB::raw('COUNT(*) as review_count'),
                DB::raw('AVG(feedback_menu_items.item_sentiment_score) as avg_sentiment_score'),
                DB::raw('AVG(feedback_menu_items.item_rating) as avg_item_rating'),
                DB::raw("SUM(CASE WHEN feedback_menu_items.item_sentiment_label = 'negative' THEN 1 ELSE 0 END) as negative_count"),
                DB::raw("SUM(CASE WHEN feedback_menu_items.item_sentiment_label = 'positive' THEN 1 ELSE 0 END) as positive_count"),
                DB::raw("SUM(CASE WHEN feedback_menu_items.item_sentiment_label = 'neutral' THEN 1 ELSE 0 END) as neutral_count"),
            ])
            ->groupBy('menu_items.id', 'menu_items.name')
            ->having('review_count', '>=', 1)
            ->orderBy('avg_sentiment_score')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $items,
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

    public function loyaltyInsights(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);
        $churnDays = (int) $request->input('churn_days', 45);
        $startDate = now()->subDays($days);

        $completedOrders = Order::where('restaurant_id', $restaurantId)
            ->where('status', 'completed')
            ->where('placed_at', '>=', $startDate);

        $loyaltyRevenue = (clone $completedOrders)->whereNotNull('user_id')->sum('total_amount');
        $guestRevenue = (clone $completedOrders)->whereNull('user_id')->sum('total_amount');
        $loyaltyOrders = (clone $completedOrders)->whereNotNull('user_id')->count();
        $guestOrders = (clone $completedOrders)->whereNull('user_id')->count();

        $loyaltyCustomers = User::query()
            ->where('role', 'customer')
            ->whereHas('orders', fn ($q) => $q->where('restaurant_id', $restaurantId));

        $tierCounts = (clone $loyaltyCustomers)
            ->select('loyalty_tier', DB::raw('COUNT(*) as count'))
            ->groupBy('loyalty_tier')
            ->pluck('count', 'loyalty_tier');

        $repeatVisitors = User::query()
            ->where('role', 'customer')
            ->whereHas('orders', function ($q) use ($restaurantId, $startDate) {
                $q->where('restaurant_id', $restaurantId)
                    ->where('status', 'completed')
                    ->where('placed_at', '>=', $startDate);
            }, '>=', 2)
            ->count();

        $activeLoyaltyCustomers = User::query()
            ->where('role', 'customer')
            ->whereHas('orders', function ($q) use ($restaurantId, $startDate) {
                $q->where('restaurant_id', $restaurantId)
                    ->where('status', 'completed')
                    ->where('placed_at', '>=', $startDate);
            })
            ->count();

        $pointsRedeemed = (int) LoyaltyTransaction::query()
            ->where('transaction_type', 'redeemed')
            ->whereHas('user.orders', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->where('created_at', '>=', $startDate)
            ->sum(DB::raw('ABS(points)'));

        $churnRisk = User::query()
            ->where('role', 'customer')
            ->whereHas('orders', fn ($q) => $q->where('restaurant_id', $restaurantId)
                ->where('status', 'completed'), '>=', 2)
            ->whereDoesntHave('orders', function ($q) use ($restaurantId, $churnDays) {
                $q->where('restaurant_id', $restaurantId)
                    ->where('status', 'completed')
                    ->where('placed_at', '>=', now()->subDays($churnDays));
            })
            ->withCount([
                'orders as restaurant_order_count' => fn ($q) => $q->where('restaurant_id', $restaurantId)
                    ->where('status', 'completed'),
            ])
            ->addSelect([
                'last_order_at' => Order::selectRaw('MAX(placed_at)')
                    ->whereColumn('orders.user_id', 'users.id')
                    ->where('restaurant_id', $restaurantId)
                    ->where('status', 'completed'),
            ])
            ->orderBy('last_order_at')
            ->limit(20)
            ->get(['id', 'name', 'email', 'loyalty_tier', 'loyalty_points']);

        return response()->json([
            'success' => true,
            'data' => [
                'loyalty_revenue' => round((float) $loyaltyRevenue, 2),
                'guest_revenue' => round((float) $guestRevenue, 2),
                'loyalty_order_count' => $loyaltyOrders,
                'guest_order_count' => $guestOrders,
                'loyalty_revenue_share' => ($loyaltyRevenue + $guestRevenue) > 0
                    ? round(($loyaltyRevenue / ($loyaltyRevenue + $guestRevenue)) * 100, 1)
                    : 0.0,
                'tier_distribution' => [
                    'bronze' => (int) ($tierCounts['bronze'] ?? 0),
                    'silver' => (int) ($tierCounts['silver'] ?? 0),
                    'gold' => (int) ($tierCounts['gold'] ?? 0),
                ],
                'repeat_visit_rate' => $activeLoyaltyCustomers > 0
                    ? round(($repeatVisitors / $activeLoyaltyCustomers) * 100, 1)
                    : 0.0,
                'points_redeemed' => $pointsRedeemed,
                'churn_risk_count' => $churnRisk->count(),
                'churn_risk_customers' => $churnRisk,
            ],
        ]);
    }

    public function fulfillmentPerformance(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);

        $orders = Order::where('restaurant_id', $restaurantId)
            ->where('placed_at', '>=', $startDate);

        $total = (clone $orders)->count();
        $cancelled = (clone $orders)->where('status', 'cancelled')->count();
        $completed = (clone $orders)->where('status', 'completed')->count();

        $avgConfirm = (clone $orders)
            ->whereNotNull('confirmed_at')
            ->selectRaw($this->minutesBetweenExpr('COALESCE(kitchen_released_at, placed_at)', 'confirmed_at').' as avg_minutes')
            ->value('avg_minutes');

        $avgPrep = (clone $orders)
            ->whereNotNull('confirmed_at')
            ->whereNotNull('ready_at')
            ->selectRaw($this->minutesBetweenExpr('confirmed_at', 'ready_at').' as avg_minutes')
            ->value('avg_minutes');

        $avgServe = (clone $orders)
            ->whereNotNull('ready_at')
            ->whereNotNull('completed_at')
            ->selectRaw($this->minutesBetweenExpr('ready_at', 'completed_at').' as avg_minutes')
            ->value('avg_minutes');

        $avgTotal = (clone $orders)
            ->where('status', 'completed')
            ->whereNotNull('completed_at')
            ->selectRaw($this->minutesBetweenExpr('COALESCE(kitchen_released_at, placed_at)', 'completed_at').' as avg_minutes')
            ->value('avg_minutes');

        $flaggedOnCompleted = Feedback::query()
            ->where('restaurant_id', $restaurantId)
            ->where('created_at', '>=', $startDate)
            ->where('is_flagged', true)
            ->whereHas('order', fn ($q) => $q->where('status', 'completed'))
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_orders' => $total,
                'completed_orders' => $completed,
                'cancelled_orders' => $cancelled,
                'cancellation_rate' => $total > 0 ? round(($cancelled / $total) * 100, 1) : 0.0,
                'avg_confirm_minutes' => round((float) ($avgConfirm ?? 0), 1),
                'avg_prep_minutes' => round((float) ($avgPrep ?? 0), 1),
                'avg_serve_minutes' => round((float) ($avgServe ?? 0), 1),
                'avg_total_fulfillment_minutes' => round((float) ($avgTotal ?? 0), 1),
                'flagged_feedback_on_completed' => $flaggedOnCompleted,
                'complaint_rate' => $completed > 0
                    ? round(($flaggedOnCompleted / $completed) * 100, 1)
                    : 0.0,
            ],
        ]);
    }

    public function tableTurnover(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $days = (int) $request->input('days', 30);
        $startDate = now()->subDays($days);

        $sessions = TableSession::query()
            ->where('restaurant_id', $restaurantId)
            ->where('started_at', '>=', $startDate)
            ->whereNotNull('ended_at');

        $avgDuration = (clone $sessions)
            ->selectRaw($this->minutesBetweenExpr('started_at', 'ended_at').' as avg_minutes')
            ->value('avg_minutes');

        $totalSessions = (clone $sessions)->count();
        $activeTables = (clone $sessions)->distinct('table_id')->count('table_id');

        $perTableAvgExpr = $this->isSqlite()
            ? 'AVG((julianday(table_sessions.ended_at) - julianday(table_sessions.started_at)) * 24 * 60)'
            : 'AVG(TIMESTAMPDIFF(MINUTE, table_sessions.started_at, table_sessions.ended_at))';

        $perTable = TableSession::query()
            ->join('tables', 'table_sessions.table_id', '=', 'tables.id')
            ->where('table_sessions.restaurant_id', $restaurantId)
            ->where('table_sessions.started_at', '>=', $startDate)
            ->whereNotNull('table_sessions.ended_at')
            ->select([
                'tables.id as table_id',
                'tables.table_number',
                DB::raw('COUNT(table_sessions.id) as session_count'),
                DB::raw("{$perTableAvgExpr} as avg_duration_minutes"),
                DB::raw('SUM(table_sessions.total_amount) as total_revenue'),
            ])
            ->groupBy('tables.id', 'tables.table_number')
            ->orderByDesc('session_count')
            ->limit(15)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'avg_session_minutes' => round((float) ($avgDuration ?? 0), 1),
                'total_sessions' => $totalSessions,
                'sessions_per_table_per_day' => ($activeTables > 0 && $days > 0)
                    ? round($totalSessions / ($activeTables * $days), 2)
                    : 0.0,
                'tables' => $perTable,
            ],
        ]);
    }

    public function demandForecast(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $date = $request->input('date', now()->addDay()->toDateString());

        $forecasts = DemandForecast::query()
            ->where('restaurant_id', $restaurantId)
            ->whereDate('forecast_date', $date)
            ->with('menuItem:id,name')
            ->orderBy('menu_item_id')
            ->orderBy('hour_of_day')
            ->get();

        if ($forecasts->isEmpty()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'forecast_date' => $date,
                    'insufficient_data' => true,
                    'items' => [],
                    'totals_by_hour' => [],
                ],
            ]);
        }

        $grouped = $forecasts->groupBy('menu_item_id')->map(function ($rows, $menuItemId) {
            $first = $rows->first();
            $hourly = $rows->map(fn ($row) => [
                'hour' => (int) $row->hour_of_day,
                'predicted_quantity' => (int) $row->predicted_quantity,
                'confidence_score' => $row->confidence_score !== null
                    ? round((float) $row->confidence_score, 4)
                    : null,
                'actual_quantity' => $row->actual_quantity,
            ])->values();

            $totalDaily = $hourly->sum('predicted_quantity');

            return [
                'menu_item_id' => (int) $menuItemId,
                'name' => $first->menuItem?->name ?? 'Unknown',
                'hourly_predictions' => $hourly,
                'total_daily' => $totalDaily,
                'recommended_prep_quantity' => (int) ceil($totalDaily * 1.1),
                'avg_confidence' => round((float) $rows->avg('confidence_score'), 4),
            ];
        })->values()->sortByDesc('total_daily')->values();

        $totalsByHour = $forecasts
            ->groupBy('hour_of_day')
            ->map(fn ($rows, $hour) => [
                'hour' => (int) $hour,
                'predicted_quantity' => (int) $rows->sum('predicted_quantity'),
            ])
            ->sortBy('hour')
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'forecast_date' => $date,
                'insufficient_data' => false,
                'items' => $grouped,
                'totals_by_hour' => $totalsByHour,
            ],
        ]);
    }
}
