<?php

namespace App\Http\Controllers\Api;

use App\Events\AllPaymentsCompleted;
use App\Events\CashPaymentPending;
use App\Events\PaymentCompleted;
use App\Events\PaymentFailed;
use App\Events\SplitBillConfigured;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\SessionParticipant;
use App\Models\SplitBillItem;
use App\Models\TableSession;
use App\Services\ReceiptService;
use App\Services\SafepayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function __construct(
        private readonly SafepayService $safepay,
        private readonly ReceiptService $receipt,
    ) {}

    // =========================================================================
    //  SESSION BILL
    // =========================================================================

    /**
     * GET /sessions/{session}/bill
     * Returns the full bill summary for a session (all orders + payment status).
     */
    public function sessionBill(TableSession $session): JsonResponse
    {
        $orders   = $session->orders()->with('items.menuItem')->get();
        $payments = $session->payments()->with('participant')->get();

        $totalBill = $orders->sum('total_amount');
        $totalPaid = $payments->where('status', 'completed')->sum('amount');
        $remaining = max($totalBill - $totalPaid, 0);

        $participantCount = $session->participants()->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'session_id'        => $session->id,
                'orders'            => $orders,
                'payments'          => $payments,
                'total_bill'        => (float) $totalBill,
                'total_paid'        => (float) $totalPaid,
                'remaining'         => (float) $remaining,
                'payment_status'    => $session->payment_status,
                'participant_count' => $participantCount,
            ],
        ]);
    }

    /**
     * GET /sessions/{session}/payment-status
     * Returns real-time payment status for all participants in a session.
     */
    public function getPaymentStatus(TableSession $session): JsonResponse
    {
        $payments = $session->payments()
            ->with('participant')
            ->latest()
            ->get();

        $allCompleted = $payments->isNotEmpty()
            && $payments->every(fn ($p) => $p->status === 'completed');

        return response()->json([
            'success' => true,
            'data'    => [
                'payment_status' => $session->payment_status,
                'all_completed'  => $allCompleted,
                'payments'       => $payments->map(fn ($p) => [
                    'id'             => $p->id,
                    'participant_id' => $p->participant_id,
                    'amount'         => (float) $p->amount,
                    'payment_method' => $p->payment_method,
                    'status'         => $p->status,
                    'receipt_url'    => $p->receipt_url,
                ]),
            ],
        ]);
    }

    // =========================================================================
    //  CHECKOUT — SINGLE / FULL PAYMENT
    // =========================================================================

    /**
     * POST /payments/checkout
     * Main checkout entry point for a single-user full payment.
     * If split_bill = true, redirects to splitBillSetup().
     *
     * Body: {
     *   session_id, participant_id?, payment_method (cash|safepay),
     *   amount, payment_type (full|split_equal|split_itemized),
     *   cart_items: [{menu_item_id, quantity, unit_price, total_price, customization_notes?}]
     * }
     */
    public function checkout(Request $request): JsonResponse
    {
        $request->validate([
            'session_id'         => 'required|exists:table_sessions,id',
            'participant_id'     => 'nullable|exists:session_participants,id',
            'payment_method'     => 'required|in:cash,safepay',
            'amount'             => 'required|numeric|min:1',
            'payment_type'       => 'required|in:full,split_equal,split_itemized',
            'cart_items'         => 'required|array|min:1',
            'cart_items.*.menu_item_id'   => 'required|exists:menu_items,id',
            'cart_items.*.quantity'        => 'required|integer|min:1',
            'cart_items.*.unit_price'      => 'required|numeric|min:0',
            'cart_items.*.total_price'     => 'required|numeric|min:0',
        ]);

        $session  = TableSession::with('table')->findOrFail($request->session_id);
        $amount   = (float) $request->amount;
        $method   = $request->payment_method;

        // Cash payment path
        if ($method === 'cash') {
            return $this->initiateCashPayment($request, $session, $amount);
        }

        // Safepay payment path
        return $this->initiateSafepayPayment($request, $session, $amount);
    }

    // =========================================================================
    //  SPLIT-BILL SETUP
    // =========================================================================

    /**
     * POST /payments/split-bill/setup
     * Host configures the split. Creates a Payment record per participant
     * all sharing the same split_group_id (atomic unit).
     *
     * Body: {
     *   session_id, split_type (split_equal|split_itemized),
     *   participants: [{
     *     participant_id, payment_method (cash|safepay),
     *     amount?,                  // required for split_itemized
     *     order_item_ids?: [...]    // required for split_itemized
     *   }]
     * }
     */
    public function splitBillSetup(Request $request): JsonResponse
    {
        $request->validate([
            'session_id'                    => 'required|exists:table_sessions,id',
            'split_type'                    => 'required|in:split_equal,split_itemized',
            'participants'                  => 'required|array|min:2',
            'participants.*.participant_id' => 'required|exists:session_participants,id',
            'participants.*.payment_method' => 'required|in:cash,safepay',
            'participants.*.amount'         => 'required|numeric|min:0',
            'participants.*.order_item_ids' => 'array',
        ]);

        $session     = TableSession::with('table')->findOrFail($request->session_id);
        $splitType   = $request->split_type;
        $splitGroupId = (string) Str::uuid();
        $totalAmount  = collect($request->participants)->sum('amount');

        DB::beginTransaction();
        try {
            $paymentParticipants = [];
            $payments            = [];

            foreach ($request->participants as $pData) {
                $participant = SessionParticipant::findOrFail($pData['participant_id']);
                $amount      = (float) $pData['amount'];

                $payment = Payment::create([
                    'session_id'     => $session->id,
                    'participant_id' => $participant->id,
                    'user_id'        => $participant->user_id,
                    'payment_method' => $pData['payment_method'],
                    'payment_type'   => $splitType,
                    'split_group_id' => $splitGroupId,
                    'amount'         => $amount,
                    'status'         => 'pending',
                ]);

                // Create SplitBillItem records for itemized splits
                if ($splitType === 'split_itemized' && !empty($pData['order_item_ids'])) {
                    foreach ($pData['order_item_ids'] as $itemId) {
                        $orderItem = OrderItem::findOrFail($itemId);
                        SplitBillItem::create([
                            'payment_id'    => $payment->id,
                            'order_item_id' => $itemId,
                            'participant_id'=> $participant->id,
                            'amount'        => $orderItem->total_price,
                        ]);
                    }
                }

                $payments[]            = $payment;
                $paymentParticipants[] = [
                    'participant_id'  => $participant->id,
                    'payment_id'      => $payment->id,
                    'amount'          => $amount,
                    'payment_method'  => $pData['payment_method'],
                ];
            }

            DB::commit();

            // Broadcast split-bill configuration to session room
            event(new SplitBillConfigured(
                $session->id,
                $splitType,
                $splitGroupId,
                $paymentParticipants,
                (float) $totalAmount,
            ));

            return response()->json([
                'success' => true,
                'data'    => [
                    'split_group_id' => $splitGroupId,
                    'split_type'     => $splitType,
                    'total_amount'   => $totalAmount,
                    'participants'   => $paymentParticipants,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('splitBillSetup failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to set up split bill'], 500);
        }
    }

    /**
     * POST /payments/split-bill/participant-checkout
     * Individual participant pays their share (after split-bill setup).
     *
     * Body: { payment_id, payment_method (cash|safepay) }
     */
    public function participantCheckout(Request $request): JsonResponse
    {
        $request->validate([
            'payment_id'     => 'required|exists:payments,id',
            'payment_method' => 'required|in:cash,safepay',
        ]);

        $payment = Payment::with('session.table')->findOrFail($request->payment_id);

        if ($payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Payment is already {$payment->status}",
            ], 409);
        }

        // Update method if participant changed their mind
        $payment->update(['payment_method' => $request->payment_method]);

        if ($request->payment_method === 'cash') {
            // Broadcast to KDS for staff confirmation
            $tableNumber = $payment->session?->table?->table_number ?? 'N/A';
            event(new CashPaymentPending(
                $payment->id,
                $payment->session_id,
                $payment->session?->restaurant_id ?? 1,
                $payment->participant_id,
                (float) $payment->amount,
                $tableNumber,
                $payment->split_group_id,
                $payment->payment_type,
            ));

            return response()->json([
                'success' => true,
                'data'    => [
                    'payment_id' => $payment->id,
                    'status'     => 'pending_cash_confirmation',
                    'message'    => 'Awaiting staff cash confirmation',
                ],
            ]);
        }

        // Safepay: create tracker and return checkout URL
        try {
            $tracker     = $this->safepay->createTracker($payment->amount, 'PKR', (string) $payment->id);
            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $callbackUrl = $frontendUrl . "/payment/callback?payment_id={$payment->id}";
            $checkoutUrl = $this->safepay->generateCheckoutUrl($tracker['token'], $callbackUrl);

            $payment->update([
                'safepay_tracker_token' => $tracker['token'],
                'status'                => 'processing',
            ]);

            return response()->json([
                'success' => true,
                'data'    => [
                    'payment_id'   => $payment->id,
                    'checkout_url' => $checkoutUrl,
                    'tracker_token'=> $tracker['token'],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('participantCheckout Safepay error', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to initiate Safepay payment'], 500);
        }
    }

    // =========================================================================
    //  SAFEPAY CALLBACKS
    // =========================================================================

    /**
     * GET /payments/safepay/callback
     * Safepay redirects the customer here after checkout.
     * Verifies payment status and completes the payment.
     */
    public function handleCallback(Request $request): JsonResponse
    {
        $trackerToken = $request->query('beacon') ?? $request->query('tracker');
        $paymentId    = $request->query('payment_id');

        if (!$trackerToken && !$paymentId) {
            return response()->json(['success' => false, 'message' => 'Missing tracker or payment reference'], 400);
        }

        // Find the payment
        $payment = $paymentId
            ? Payment::with('session.table')->find($paymentId)
            : Payment::with('session.table')->where('safepay_tracker_token', $trackerToken)->first();

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        // Use tracker from DB if not in URL
        $trackerToken = $trackerToken ?? $payment->safepay_tracker_token;

        try {
            $trackerData = $this->safepay->fetchTrackerStatus($trackerToken);

            if ($this->safepay->isPaymentSuccessful($trackerData)) {
                return $this->completePayment($payment, $trackerData);
            }

            // Payment failed
            $payment->update(['status' => 'failed']);
            $this->handleSplitGroupFailure($payment, 'Safepay payment was not successful');

            return response()->json([
                'success' => false,
                'data'    => ['payment_id' => $payment->id, 'status' => 'failed'],
            ]);
        } catch (\Exception $e) {
            Log::error('handleCallback error', ['error' => $e->getMessage(), 'payment_id' => $payment->id]);
            return response()->json(['success' => false, 'message' => 'Callback processing failed'], 500);
        }
    }

    /**
     * POST /payments/safepay/webhook
     * Server-to-server webhook from Safepay (canonical payment confirmation).
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $rawPayload = $request->getContent();
        $signature  = $request->header('X-SFPY-SIGNATURE', '');

        // Verify HMAC signature
        if (!$this->safepay->verifyWebhookSignature($rawPayload, $signature)) {
            Log::warning('Safepay webhook: invalid signature');
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 401);
        }

        $payload = json_decode($rawPayload, true);
        $event   = $payload['type'] ?? '';
        $data    = $payload['data'] ?? [];

        Log::info('Safepay webhook received', ['event' => $event]);

        // Handle payment success events
        if (in_array($event, ['payment:created', 'payment:success', 'order:paid'], true)) {
            $trackerToken = $data['tracker']['token'] ?? $data['token'] ?? null;
            if (!$trackerToken) {
                return response()->json(['success' => false, 'message' => 'No tracker token in webhook'], 400);
            }

            $payment = Payment::with('session.table')->where('safepay_tracker_token', $trackerToken)->first();
            if (!$payment) {
                Log::warning('Safepay webhook: payment not found for tracker', ['token' => $trackerToken]);
                return response()->json(['success' => true]); // Idempotent - already processed or unknown
            }

            if ($payment->status === 'completed') {
                return response()->json(['success' => true]); // Idempotent
            }

            $this->completePayment($payment, $data);
        }

        return response()->json(['success' => true]);
    }

    // =========================================================================
    //  CASH PAYMENT — STAFF CONFIRMATION (KDS)
    // =========================================================================

    /**
     * POST /payments/{payment}/confirm-cash
     * Staff confirms a cash payment from the KDS dashboard.
     */
    public function confirmCashPayment(Request $request, Payment $payment): JsonResponse
    {
        if ($payment->payment_method !== 'cash') {
            return response()->json(['success' => false, 'message' => 'Not a cash payment'], 422);
        }

        if ($payment->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => "Payment is already {$payment->status}",
            ], 409);
        }

        $payment->update([
            'status'  => 'completed',
            'paid_at' => now(),
        ]);

        $payment->refresh()->load('session.table');

        // Generate and store receipt
        try {
            $receiptUrl = $this->receipt->generateAndStore($payment);
        } catch (\Exception $e) {
            Log::error('Receipt generation failed for cash payment', ['payment_id' => $payment->id, 'error' => $e->getMessage()]);
            $receiptUrl = null;
        }

        // Broadcast payment completed
        event(new PaymentCompleted(
            $payment->id,
            $payment->session_id,
            $payment->participant_id,
            (float) $payment->amount,
            'cash',
            $payment->split_group_id,
            $receiptUrl,
        ));

        // Check if this completes an atomic split group
        if ($payment->split_group_id) {
            $this->checkSplitGroupCompletion($payment);
        } else {
            // Single full payment — create the order and mark session paid
            $this->finalizeSession($payment->session_id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cash payment confirmed',
            'data'    => [
                'payment_id'  => $payment->id,
                'status'      => 'completed',
                'receipt_url' => $receiptUrl,
            ],
        ]);
    }

    // =========================================================================
    //  RECEIPT DOWNLOAD
    // =========================================================================

    /**
     * GET /payments/{payment}/receipt
     * Returns a (pre-signed) S3 URL to download the PDF receipt.
     */
    public function downloadReceipt(Payment $payment): JsonResponse
    {
        if (!$payment->receipt_s3_key && !$payment->receipt_url) {
            return response()->json(['success' => false, 'message' => 'Receipt not yet generated'], 404);
        }

        try {
            $url = $this->receipt->getDownloadUrl($payment);
            return response()->json(['success' => true, 'data' => ['url' => $url]]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to generate download URL'], 500);
        }
    }

    // =========================================================================
    //  PRIVATE HELPERS
    // =========================================================================

    /**
     * Initiate a cash checkout (full bill, single user).
     */
    private function initiateCashPayment(Request $request, TableSession $session, float $amount): JsonResponse
    {
        DB::beginTransaction();
        try {
            $payment = Payment::create([
                'session_id'     => $session->id,
                'participant_id' => $request->participant_id,
                'payment_method' => 'cash',
                'payment_type'   => $request->payment_type,
                'amount'         => $amount,
                'status'         => 'pending',
            ]);

            DB::commit();

            // Broadcast to KDS
            $tableNumber = $session->table?->table_number ?? 'N/A';
            event(new CashPaymentPending(
                $payment->id,
                $session->id,
                $session->restaurant_id,
                $request->participant_id,
                $amount,
                $tableNumber,
            ));

            return response()->json([
                'success' => true,
                'data'    => [
                    'payment_id'  => $payment->id,
                    'status'      => 'pending_cash_confirmation',
                    'message'     => 'Awaiting staff cash confirmation at the table',
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('initiateCashPayment failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to initiate cash payment'], 500);
        }
    }

    /**
     * Initiate a Safepay checkout (full bill, single user).
     */
    private function initiateSafepayPayment(Request $request, TableSession $session, float $amount): JsonResponse
    {
        DB::beginTransaction();
        try {
            $payment = Payment::create([
                'session_id'     => $session->id,
                'participant_id' => $request->participant_id,
                'payment_method' => 'safepay',
                'payment_type'   => $request->payment_type,
                'amount'         => $amount,
                'status'         => 'processing',
            ]);

            // Create Safepay tracker
            $tracker = $this->safepay->createTracker($amount, 'PKR', (string) $payment->id);

            $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
            $callbackUrl = $frontendUrl . "/payment/callback?payment_id={$payment->id}";
            $cancelUrl   = $frontendUrl . "/payment/callback?payment_id={$payment->id}&cancelled=1";
            $checkoutUrl = $this->safepay->generateCheckoutUrl($tracker['token'], $callbackUrl, $cancelUrl);

            $payment->update(['safepay_tracker_token' => $tracker['token']]);

            DB::commit();

            return response()->json([
                'success' => true,
                'data'    => [
                    'payment_id'    => $payment->id,
                    'checkout_url'  => $checkoutUrl,
                    'tracker_token' => $tracker['token'],
                    'amount'        => $amount,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('initiateSafepayPayment failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to initiate Safepay payment: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Mark a payment as completed, generate receipt, and check split group.
     */
    private function completePayment(Payment $payment, array $trackerData = []): JsonResponse
    {
        $referenceCode = $trackerData['reference_number'] ?? $trackerData['reference'] ?? null;

        $payment->update([
            'status'                 => 'completed',
            'paid_at'                => now(),
            'safepay_reference_code' => $referenceCode,
            'transaction_id'         => $referenceCode ?? $payment->safepay_tracker_token,
            'gateway_response'       => $trackerData ?: null,
        ]);

        $payment->refresh()->load('session.table');

        // Generate receipt async (fire-and-forget with graceful degradation)
        $receiptUrl = null;
        try {
            $receiptUrl = $this->receipt->generateAndStore($payment);
        } catch (\Exception $e) {
            Log::error('Receipt generation failed', ['payment_id' => $payment->id, 'error' => $e->getMessage()]);
        }

        // Broadcast payment completed event
        event(new PaymentCompleted(
            $payment->id,
            $payment->session_id,
            $payment->participant_id,
            (float) $payment->amount,
            $payment->payment_method,
            $payment->split_group_id,
            $receiptUrl,
        ));

        // Handle split group or single payment finalization
        if ($payment->split_group_id) {
            $this->checkSplitGroupCompletion($payment);
        } else {
            $this->finalizeSession($payment->session_id);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'payment_id'  => $payment->id,
                'status'      => 'completed',
                'receipt_url' => $receiptUrl,
            ],
        ]);
    }

    /**
     * Check if all payments in a split group are completed.
     * If yes, finalize the session. If any failed, roll back.
     */
    private function checkSplitGroupCompletion(Payment $completedPayment): void
    {
        $groupPayments = Payment::splitGroup($completedPayment->split_group_id)->get();

        $allCompleted = $groupPayments->every(fn ($p) => $p->status === 'completed');
        $anyFailed    = $groupPayments->contains(fn ($p) => in_array($p->status, ['failed', 'voided']));

        if ($allCompleted) {
            // Collect all receipt URLs
            $receiptUrls = $groupPayments->pluck('receipt_url', 'participant_id')->toArray();
            $sessionId   = $completedPayment->session_id;
            $totalAmount = $groupPayments->sum('amount');

            // Create the order (all payments are confirmed)
            $orderId = $this->finalizeSession($sessionId);

            event(new AllPaymentsCompleted(
                $sessionId,
                $orderId ?? 0,
                (float) $totalAmount,
                $completedPayment->split_group_id,
                $receiptUrls,
            ));
        } elseif ($anyFailed) {
            $this->handleSplitGroupFailure($completedPayment, 'A participant\'s payment failed');
        }
    }

    /**
     * Void all payments in a split group and initiate Safepay refunds.
     */
    private function handleSplitGroupFailure(Payment $failedPayment, string $reason): void
    {
        if (!$failedPayment->split_group_id) {
            return;
        }

        $groupPayments = Payment::splitGroup($failedPayment->split_group_id)->get();

        foreach ($groupPayments as $p) {
            if ($p->id === $failedPayment->id) {
                continue; // Already marked as failed
            }

            if ($p->status === 'completed' && $p->payment_method === 'safepay' && $p->safepay_tracker_token) {
                // Initiate Safepay refund
                try {
                    $this->safepay->refundPayment($p->safepay_tracker_token);
                } catch (\Exception $e) {
                    Log::error('Safepay refund failed during rollback', [
                        'payment_id' => $p->id,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            $p->update(['status' => 'voided']);
        }

        $failedPayment->update(['status' => 'failed']);

        event(new PaymentFailed(
            $failedPayment->session_id,
            $failedPayment->split_group_id,
            $failedPayment->participant_id,
            $reason,
            true, // rollback initiated
        ));
    }

    /**
     * Mark the session as paid.
     * Also transitions any pending_payment orders to pending so the kitchen can prepare them.
     * Returns the ID of the last processed order (if any).
     */
    private function finalizeSession(int $sessionId): ?int
    {
        TableSession::where('id', $sessionId)->update(['payment_status' => 'paid']);
        
        $orders = Order::where('session_id', $sessionId)
            ->where('status', 'pending_payment')
            ->get();
            
        $lastOrderId = null;
        
        foreach ($orders as $order) {
            $order->update(['status' => 'pending']);
            $lastOrderId = $order->id;
            
            // Broadcast the status update so KDS adds it to pending
            event(new \App\Events\OrderStatusUpdated(
                $order->id,
                'pending',
                $order->restaurant_id,
                $order->table_id
            ));
        }
        
        return $lastOrderId;
    }
}