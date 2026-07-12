<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    use ResolvesRestaurant;

    /**
     * Paginated payment ledger, scoped to the authenticated restaurant via
     * the owning order's restaurant_id (payments carry no restaurant_id of their own).
     * Refund actions are intentionally not exposed here.
     */
    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $query = Payment::query()
            ->whereHas('order', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->with(['order.table', 'user', 'participant']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $payments = $query->orderByDesc('created_at')->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    /**
     * Pending cash payments awaiting staff confirmation for this restaurant.
     */
    public function pendingCash(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $payments = Payment::query()
            ->whereHas('order', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->where('payment_method', 'cash')
            ->where('status', 'pending')
            ->with(['order.table', 'order.items.menuItem', 'user', 'participant'])
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }
}
