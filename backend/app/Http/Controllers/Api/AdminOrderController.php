<?php

namespace App\Http\Controllers\Api;

use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminOrderController extends Controller
{
    use ResolvesRestaurant;

    /**
     * Paginated order list for the authenticated restaurant with common filters.
     */
    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $query = Order::where('restaurant_id', $restaurantId)
            ->with(['table', 'user']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('placed_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('placed_at', '<=', $request->date_to);
        }

        if ($request->filled('table_id')) {
            $query->where('table_id', $request->table_id);
        }

        if ($request->filled('search')) {
            $query->where('order_number', 'like', '%'.$request->search.'%');
        }

        $orders = $query->orderByDesc('placed_at')->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Full order detail: items, table, user, and payments.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $order = Order::where('restaurant_id', $restaurantId)
            ->with(['items.menuItem', 'items.customizations', 'table', 'user', 'payments'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Cancel an order with an optional reason, if its current status allows it.
     */
    public function cancel(Request $request, int $id, LoyaltyService $loyalty): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $order = Order::where('restaurant_id', $restaurantId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        if (in_array($order->status, ['completed', 'cancelled'], true)) {
            return response()->json([
                'success' => false,
                'message' => "Order cannot be cancelled from its current status ('{$order->status}').",
            ], 409);
        }

        $updates = ['status' => 'cancelled'];

        if ($request->filled('reason')) {
            $note = '[Cancelled by staff: '.$request->reason.']';
            $updates['special_instructions'] = trim(($order->special_instructions ? $order->special_instructions.' ' : '').$note);
        }

        $loyalty->reversePoints($order);
        $order->update($updates);

        broadcast(new OrderStatusUpdated(
            $order->id,
            'cancelled',
            $order->restaurant_id,
            $order->table_id,
        ));

        return response()->json([
            'success' => true,
            'message' => 'Order cancelled',
            'data' => $order->fresh(['items.menuItem', 'table', 'user', 'payments']),
        ]);
    }
}
