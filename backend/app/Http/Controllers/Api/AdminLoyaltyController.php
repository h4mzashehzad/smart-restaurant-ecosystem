<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminLoyaltyController extends Controller
{
    use ResolvesRestaurant;

    /**
     * Paginated loyalty customers who have ordered at this restaurant.
     */
    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $query = User::query()
            ->where('role', 'customer')
            ->whereHas('orders', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->withCount([
                'orders as restaurant_order_count' => fn ($q) => $q->where('restaurant_id', $restaurantId)
                    ->where('status', '!=', 'cancelled'),
            ])
            ->withSum([
                'orders as restaurant_total_spend' => fn ($q) => $q->where('restaurant_id', $restaurantId)
                    ->whereNotIn('status', ['cancelled', 'pending_payment']),
            ], 'total_amount')
            ->addSelect([
                'last_order_at' => Order::selectRaw('MAX(placed_at)')
                    ->whereColumn('orders.user_id', 'users.id')
                    ->where('restaurant_id', $restaurantId),
            ]);

        if ($request->filled('tier')) {
            $query->where('loyalty_tier', $request->tier);
        }

        if ($request->filled('search')) {
            $search = '%'.$request->search.'%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                    ->orWhere('email', 'like', $search)
                    ->orWhere('phone', 'like', $search);
            });
        }

        $customers = $query
            ->orderByDesc('loyalty_points')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Aggregated loyalty stats for this restaurant's customers.
     */
    public function summary(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $base = User::query()
            ->where('role', 'customer')
            ->whereHas('orders', fn ($q) => $q->where('restaurant_id', $restaurantId));

        $totalCustomers = (clone $base)->count();
        $tierCounts = (clone $base)
            ->select('loyalty_tier', DB::raw('COUNT(*) as count'))
            ->groupBy('loyalty_tier')
            ->pluck('count', 'loyalty_tier');

        $totalPointsIssued = (int) LoyaltyTransaction::query()
            ->where('transaction_type', 'earned')
            ->whereHas('order', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->whereHas('user', function ($q) use ($restaurantId) {
                $q->where('role', 'customer')
                    ->whereHas('orders', fn ($oq) => $oq->where('restaurant_id', $restaurantId));
            })
            ->sum('points');

        return response()->json([
            'success' => true,
            'data' => [
                'total_customers' => $totalCustomers,
                'bronze_count' => (int) ($tierCounts['bronze'] ?? 0),
                'silver_count' => (int) ($tierCounts['silver'] ?? 0),
                'gold_count' => (int) ($tierCounts['gold'] ?? 0),
                'total_points_issued' => $totalPointsIssued,
            ],
        ]);
    }

    /**
     * Customer loyalty detail + paginated transaction history.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $customer = User::query()
            ->where('role', 'customer')
            ->where('id', $id)
            ->whereHas('orders', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->withCount([
                'orders as restaurant_order_count' => fn ($q) => $q->where('restaurant_id', $restaurantId)
                    ->where('status', '!=', 'cancelled'),
            ])
            ->withSum([
                'orders as restaurant_total_spend' => fn ($q) => $q->where('restaurant_id', $restaurantId)
                    ->whereNotIn('status', ['cancelled', 'pending_payment']),
            ], 'total_amount')
            ->firstOrFail();

        $transactions = LoyaltyTransaction::query()
            ->where('user_id', $customer->id)
            ->whereHas('order', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->with('order:id,order_number,total_amount,placed_at')
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => [
                'customer' => $customer,
                'transactions' => $transactions,
            ],
        ]);
    }
}
