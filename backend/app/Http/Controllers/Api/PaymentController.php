<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\SessionParticipant;
use App\Models\SplitBillItem;
use App\Models\TableSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    /**
     * Initiate a payment for an order.
     */
    public function initiate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id'       => 'required|exists:orders,id',
            'payment_method' => 'required|in:cash,card,jazzcash,easypaisa',
            'amount'         => 'required|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $order = Order::findOrFail($request->order_id);

        $payment = Payment::create([
            'order_id'       => $order->id,
            'session_id'     => $order->session_id,
            'user_id'        => $request->user()->id,
            'payment_method' => $request->payment_method,
            'payment_type'   => 'full',
            'amount'         => $request->amount,
            'transaction_id' => 'TXN-' . now()->format('YmdHis') . '-' . rand(1000, 9999),
            'status'         => 'pending',
        ]);

        // For mobile-wallet methods, generate a checkout URL (stub)
        $paymentUrl = null;
        if (in_array($request->payment_method, ['jazzcash', 'easypaisa'])) {
            // TODO: Integrate with payment gateway to get checkout URL
            $paymentUrl = "https://payment-gateway.example.com/checkout?txn={$payment->transaction_id}";
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment initiated',
            'data'    => [
                'payment'     => $payment,
                'payment_url' => $paymentUrl,
            ],
        ], 201);
    }

    /**
     * Process a split-bill payment.
     */
    public function splitBill(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'session_id'                     => 'required|exists:table_sessions,id',
            'split_type'                     => 'required|in:equal,itemized',
            'splits'                         => 'required|array|min:2',
            'splits.*.participant_id'        => 'required|exists:session_participants,id',
            'splits.*.payment_method'        => 'required|in:cash,card,jazzcash,easypaisa',
            'splits.*.order_item_ids'        => 'required_if:split_type,itemized|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $session      = TableSession::findOrFail($request->session_id);
        $sessionTotal = $session->orders()->sum('total_amount');

        DB::beginTransaction();

        try {
            $payments = [];

            foreach ($request->splits as $split) {
                $participant = SessionParticipant::findOrFail($split['participant_id']);

                if ($request->split_type === 'equal') {
                    $amount = round($sessionTotal / count($request->splits), 2);
                } else {
                    // Itemized: sum the selected items + proportional tax
                    $itemsTotal = OrderItem::whereIn('id', $split['order_item_ids'])->sum('total_price');
                    $sessionSubtotal = $session->orders()->sum('subtotal');
                    $taxShare = $sessionSubtotal > 0
                        ? $session->orders()->sum('tax_amount') * ($itemsTotal / $sessionSubtotal)
                        : 0;
                    $amount = round($itemsTotal + $taxShare, 2);
                }

                $payment = Payment::create([
                    'session_id'     => $session->id,
                    'participant_id' => $participant->id,
                    'user_id'        => $participant->user_id,
                    'payment_method' => $split['payment_method'],
                    'payment_type'   => $request->split_type === 'equal' ? 'split_equal' : 'split_itemized',
                    'amount'         => $amount,
                    'transaction_id' => 'TXN-' . now()->format('YmdHis') . '-' . rand(1000, 9999),
                    'status'         => 'pending',
                ]);

                // Create split bill item records for itemized splits
                if ($request->split_type === 'itemized') {
                    foreach ($split['order_item_ids'] as $itemId) {
                        $orderItem = OrderItem::findOrFail($itemId);
                        SplitBillItem::create([
                            'payment_id'     => $payment->id,
                            'order_item_id'  => $itemId,
                            'participant_id' => $participant->id,
                            'amount'         => $orderItem->total_price,
                        ]);
                    }
                }

                $payments[] = $payment;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data'    => [
                    'payments'           => $payments,
                    'total_session_bill' => $sessionTotal,
                    'remaining_amount'   => 0,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to process split bill',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Confirm a payment (webhook / manual).
     */
    public function confirm(Payment $payment): JsonResponse
    {
        $payment->update([
            'status'  => 'completed',
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment confirmed',
            'data'    => $payment->fresh(),
        ]);
    }

    /**
     * Refund a payment.
     */
    public function refund(Payment $payment): JsonResponse
    {
        if ($payment->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Only completed payments can be refunded',
            ], 409);
        }

        $payment->update(['status' => 'refunded']);

        return response()->json([
            'success' => true,
            'message' => 'Payment refunded',
            'data'    => $payment->fresh(),
        ]);
    }

    /**
     * Get the full bill summary for a session.
     */
    public function sessionBill(TableSession $session): JsonResponse
    {
        $orders   = $session->orders()->with('items.menuItem')->get();
        $payments = $session->payments;

        $totalBill   = $orders->sum('total_amount');
        $totalPaid   = $payments->where('status', 'completed')->sum('amount');
        $remaining   = max($totalBill - $totalPaid, 0);

        return response()->json([
            'success' => true,
            'data'    => [
                'orders'       => $orders,
                'payments'     => $payments,
                'total_bill'   => $totalBill,
                'total_paid'   => $totalPaid,
                'remaining'    => $remaining,
            ],
        ]);
    }
}
