<?php

namespace App\Http\Controllers\Api;

use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemCustomization;
use App\Models\TableSession;
use App\Services\IngredientCustomizationPricer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    /**
     * Create a new order.
     */
    public function store(Request $request, IngredientCustomizationPricer $pricer): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'session_id' => 'required|exists:table_sessions,id',
            'table_id' => 'required|exists:tables,id',
            'items' => 'required|array|min:1|max:20',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1|max:10',
            'items.*.customizations' => 'nullable|array',
            'items.*.customizations.*.ingredient_id' => 'required_with:items.*.customizations|exists:ingredients,id',
            'items.*.customizations.*.action' => 'required_with:items.*.customizations|in:add,remove,modify',
            'items.*.customizations.*.quantity' => 'nullable|numeric|min:0',
            'special_instructions' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();

        try {
            $subtotal = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);
                $priced = $pricer->price($menuItem, $item['customizations'] ?? []);
                $finalUnitPrice = (float) $menuItem->base_price + $priced['unit_price_adjustment'];
                $totalPrice = $finalUnitPrice * $item['quantity'];
                $subtotal += $totalPrice;

                $itemsData[] = [
                    'menu_item' => $menuItem,
                    'quantity' => $item['quantity'],
                    'unit_price' => $finalUnitPrice,
                    'total_price' => $totalPrice,
                    'customizations' => $priced['normalized_rows'],
                ];
            }

            $taxAmount = round($subtotal * 0.12, 2); // 12% tax
            $totalAmount = $subtotal + $taxAmount;

            // Determine restaurant_id from the session
            $session = TableSession::findOrFail($request->session_id);

            $order = Order::create([
                'restaurant_id' => $session->restaurant_id,
                'table_id' => $request->table_id,
                'session_id' => $request->session_id,
                'user_id' => Auth::guard('sanctum')->id(),
                'order_number' => 'ORD-'.now()->format('Ymd').'-'.rand(1000, 9999),
                'order_type' => 'dine_in',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'special_instructions' => $request->special_instructions,
                'placed_at' => now(),
            ]);

            // Create order items and customizations
            foreach ($itemsData as $data) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $data['menu_item']->id,
                    'quantity' => $data['quantity'],
                    'unit_price' => $data['unit_price'],
                    'total_price' => $data['total_price'],
                ]);

                foreach ($data['customizations'] as $c) {
                    OrderItemCustomization::create([
                        'order_item_id' => $orderItem->id,
                        'ingredient_id' => $c['ingredient_id'],
                        'action' => $c['action'],
                        'quantity' => $c['quantity'],
                        'price_adjustment' => $c['price_adjustment'],
                    ]);
                }
            }

            DB::commit();

            $order->load('items.menuItem', 'items.customizations', 'table', 'user');

            broadcast(new OrderCreated($order));

            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully',
                'data' => [
                    'order' => $order,
                ],
            ], 201);
        } catch (ValidationException $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get order details.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $order->load(['items.menuItem', 'items.customizations', 'table', 'user', 'payments']),
        ]);
    }

    /**
     * Get all orders for a session.
     */
    public function sessionOrders(TableSession $session): JsonResponse
    {
        $orders = $session->orders()
            ->with(['items.menuItem', 'user'])
            ->orderByDesc('placed_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Update order status (staff/admin).
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:confirmed,preparing,ready,served,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $order->update(['status' => $request->status]);

        // Set lifecycle timestamps
        $timestampMap = [
            'confirmed' => 'confirmed_at',
            'ready' => 'ready_at',
            'completed' => 'completed_at',
        ];

        if (isset($timestampMap[$request->status]) && ! $order->{$timestampMap[$request->status]}) {
            $order->update([$timestampMap[$request->status] => now()]);
        }

        broadcast(new OrderStatusUpdated(
            $order->id,
            $request->status,
            $order->restaurant_id,
            $order->table_id,
        ));

        return response()->json([
            'success' => true,
            'message' => 'Order status updated',
            'data' => $order->fresh(),
        ]);
    }

    /**
     * Cancel an order.
     */
    public function cancel(Order $order): JsonResponse
    {
        if (in_array($order->status, ['completed', 'cancelled'])) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be cancelled in its current state',
            ], 409);
        }

        $order->update(['status' => 'cancelled']);

        broadcast(new OrderStatusUpdated(
            $order->id,
            'cancelled',
            $order->restaurant_id,
            $order->table_id
        ));

        return response()->json([
            'success' => true,
            'message' => 'Order cancelled successfully',
        ]);
    }

    /**
     * Get order history for authenticated user.
     */
    public function history(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with(['items.menuItem', 'restaurant'])
            ->orderByDesc('placed_at')
            ->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Webhook for socket server to update order status.
     */
    public function webhookUpdateStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'status' => 'required|in:confirmed,preparing,ready,served,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $order = Order::findOrFail($request->order_id);
        $order->update(['status' => $request->status]);

        $timestampMap = [
            'confirmed' => 'confirmed_at',
            'ready' => 'ready_at',
            'completed' => 'completed_at',
        ];

        if (isset($timestampMap[$request->status]) && ! $order->{$timestampMap[$request->status]}) {
            $order->update([$timestampMap[$request->status] => now()]);
        }

        broadcast(new OrderStatusUpdated(
            $order->id,
            $request->status,
            $order->restaurant_id,
            $order->table_id,
        ));

        return response()->json([
            'success' => true,
            'message' => 'Order status updated via webhook',
        ]);
    }
}
