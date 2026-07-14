<?php

namespace App\Http\Controllers\Api;

use App\Events\CashPaymentPending;
use App\Events\CheckoutStarted;
use App\Events\SessionStateChanged;
use App\Events\SplitBillConfigured;
use App\Events\SplitBillItemClaimed;
use App\Events\SplitBillUnlocked;
use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemCustomization;
use App\Models\Payment;
use App\Models\SessionParticipant;
use App\Models\SplitBillItem;
use App\Models\TableSession;
use App\Services\IngredientCustomizationPricer;
use App\Services\PaymentCompletionService;
use App\Services\ReceiptService;
use App\Services\SafepayService;
use App\Services\SplitBillService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function __construct(
        protected SafepayService $safepay,
        protected SplitBillService $splitBill,
        protected PaymentCompletionService $completion,
        protected ReceiptService $receipts,
        protected IngredientCustomizationPricer $pricer,
    ) {}

    /**
     * Create a draft order and start full payment (cash or Safepay), or return draft for split flow.
     */
    public function checkout(Request $request): JsonResponse
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
            'mode' => 'required|in:full,split_equal,split_itemized',
            'payment_method' => 'required_if:mode,full|in:cash,safepay',
            'participant_id' => 'nullable|exists:session_participants,id',
            'device_id' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $session = TableSession::findOrFail($request->session_id);
        $participant = $this->resolveParticipant($session, $request);

        try {
            $existingDraft = $session->orders()
                ->where('status', 'pending_payment')
                ->with('items.menuItem')
                ->latest()
                ->first();

            if ($existingDraft && $request->mode !== 'full') {
                $existingPayments = $session->payments()
                    ->where('order_id', $existingDraft->id)
                    ->whereNotNull('split_group_id')
                    ->get();

                $splitType = $existingPayments->isNotEmpty()
                    ? ($existingPayments->first()->payment_type === 'split_equal' ? 'equal' : 'itemized')
                    : null;

                return response()->json([
                    'success' => true,
                    'message' => 'Existing draft order for this session',
                    'data' => [
                        'order' => $existingDraft,
                        'claimable_units' => $this->splitBill->expandClaimableUnits($existingDraft),
                        'claims' => $this->currentClaimsPayload($existingDraft),
                        'mode' => $request->mode,
                        'split_type' => $splitType,
                        'payments' => $existingPayments,
                        'participant_id' => $participant?->id,
                        'reused' => true,
                    ],
                ]);
            }

            $order = DB::transaction(function () use ($request, $session) {
                return $this->createDraftOrder($request, $session);
            });

            $session->update(['status' => 'checkout_pending']);
            event(new SessionStateChanged($session->id));

            if ($request->mode !== 'full') {
                $units = $this->splitBill->expandClaimableUnits($order);

                broadcast(new CheckoutStarted(
                    sessionId: $session->id,
                    orderId: $order->id,
                    orderNumber: $order->order_number,
                    mode: $request->mode,
                    subtotal: (float) $order->subtotal,
                    taxAmount: (float) $order->tax_amount,
                    totalAmount: (float) $order->total_amount,
                    claimableUnits: $units,
                    initiatorParticipantId: $participant?->id,
                ));

                return response()->json([
                    'success' => true,
                    'message' => 'Draft order created for split bill',
                    'data' => [
                        'order' => $order->load('items.menuItem'),
                        'claimable_units' => $units,
                        'mode' => $request->mode,
                        'participant_id' => $participant?->id,
                    ],
                ], 201);
            }

            $payment = Payment::create([
                'order_id' => $order->id,
                'session_id' => $session->id,
                'participant_id' => $participant?->id,
                'user_id' => $participant?->user_id ?? Auth::guard('sanctum')->id(),
                'payment_method' => $request->payment_method,
                'payment_type' => 'full',
                'amount' => $order->total_amount,
                'transaction_id' => $this->splitBill->makeTxnId(),
                'status' => $request->payment_method === 'safepay' ? 'processing' : 'pending',
                'expires_at' => now()->addMinutes(config('safepay.split_timeout_minutes', 10)),
            ]);

            $response = $this->beginPaymentMethod($payment, $request->payment_method);
            $payload = $response->getData(true);
            $payload['data']['order'] = $order;

            return response()->json($payload, $response->status());
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Checkout failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function setupSplitBill(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'session_id' => 'required|exists:table_sessions,id',
            'split_type' => 'required|in:equal,itemized',
            'participant_ids' => 'required_if:split_type,equal|array|min:2',
            'participant_ids.*' => 'exists:session_participants,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $order = Order::with('items')->findOrFail($request->order_id);
        $session = TableSession::findOrFail($request->session_id);

        if ($order->session_id !== $session->id || $order->status !== 'pending_payment') {
            return response()->json(['success' => false, 'message' => 'Invalid order for split setup'], 422);
        }

        try {
            $payments = DB::transaction(function () use ($request, $order, $session) {
                if ($request->split_type === 'equal') {
                    $participants = SessionParticipant::whereIn('id', $request->participant_ids)
                        ->where('session_id', $session->id)
                        ->whereNull('left_at')
                        ->get();

                    return $this->splitBill->setupEqualSplit($order, $session, $participants);
                }

                return $this->splitBill->setupItemizedSplit($order, $session);
            });

            $groupId = $payments->first()->split_group_id;
            $payload = $payments->map(fn (Payment $p) => [
                'payment_id' => $p->id,
                'id' => $p->id,
                'participant_id' => $p->participant_id,
                'amount' => (float) $p->amount,
                'method' => $p->payment_method,
                'payment_method' => $p->payment_method,
                'status' => $p->status,
            ])->values()->all();

            broadcast(new SplitBillConfigured(
                sessionId: $session->id,
                splitType: $request->split_type,
                splitGroupId: $groupId,
                participants: $payload,
                orderId: $order->id,
                orderNumber: $order->order_number,
                subtotal: (float) $order->subtotal,
                taxAmount: (float) $order->tax_amount,
                totalAmount: (float) $order->total_amount,
            ));

            return response()->json([
                'success' => true,
                'data' => [
                    'split_group_id' => $groupId,
                    'payments' => $payments,
                    'order' => $order,
                    'split_type' => $request->split_type,
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to setup split bill',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function unlockSplitBill(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'session_id' => 'required|exists:table_sessions,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $order = Order::with('items')->findOrFail($request->order_id);
        $session = TableSession::findOrFail($request->session_id);

        if ($order->session_id !== $session->id || $order->status !== 'pending_payment') {
            return response()->json(['success' => false, 'message' => 'Invalid order for unlock'], 422);
        }

        try {
            DB::transaction(function () use ($order) {
                $this->splitBill->unlockItemizedSplit($order);
            });

            $claims = $this->currentClaimsPayload($order);
            $units = $this->splitBill->expandClaimableUnits($order);

            broadcast(new SplitBillUnlocked(
                sessionId: $session->id,
                orderId: $order->id,
                claims: $claims,
                claimableUnits: $units,
            ));

            return response()->json([
                'success' => true,
                'data' => [
                    'claims' => $claims,
                    'claimable_units' => $units,
                    'order' => $order,
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unlock split bill',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function claimItem(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'session_id' => 'required|exists:table_sessions,id',
            'order_item_id' => 'required|exists:order_items,id',
            'unit_index' => 'required|integer|min:0',
            'action' => 'required|in:claim,unclaim',
            'participant_id' => 'nullable|exists:session_participants,id',
            'device_id' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $session = TableSession::findOrFail($request->session_id);
        $order = Order::findOrFail($request->order_id);
        $participant = $this->resolveParticipant($session, $request);

        if (! $participant) {
            return response()->json(['success' => false, 'message' => 'Participant required'], 422);
        }

        $locked = Payment::query()
            ->where('order_id', $order->id)
            ->where('payment_type', 'split_itemized')
            ->whereNotNull('split_group_id')
            ->exists();

        if ($locked) {
            return response()->json([
                'success' => false,
                'message' => 'Claims are locked. Go back to edit items first.',
            ], 409);
        }

        try {
            if ($request->action === 'claim') {
                $claim = $this->splitBill->claimUnit($order, $participant, (int) $request->order_item_id, (int) $request->unit_index);
                $amount = (float) $claim->amount;
            } else {
                $this->splitBill->unclaimUnit($order, $participant, (int) $request->order_item_id, (int) $request->unit_index);
                $amount = 0;
            }

            $claims = $this->currentClaimsPayload($order);
            $units = $this->splitBill->expandClaimableUnits($order);

            broadcast(new SplitBillItemClaimed(
                sessionId: $session->id,
                orderId: $order->id,
                orderItemId: (int) $request->order_item_id,
                unitIndex: (int) $request->unit_index,
                participantId: $participant->id,
                action: $request->action,
                amount: $amount,
                claims: $claims,
                claimableUnits: $units,
            ));

            return response()->json([
                'success' => true,
                'data' => [
                    'claims' => $claims,
                    'claimable_units' => $units,
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 409);
        }
    }

    public function participantCheckout(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payment_id' => 'required|exists:payments,id',
            'payment_method' => 'required|in:cash,safepay',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $payment = Payment::findOrFail($request->payment_id);

        if (in_array($payment->status, ['completed', 'refunded'], true)) {
            return response()->json(['success' => false, 'message' => 'Payment already completed'], 409);
        }

        if ($payment->expires_at && $payment->expires_at->isPast() && $payment->status !== 'completed') {
            $payment->update(['status' => 'expired']);

            return response()->json(['success' => false, 'message' => 'Payment window expired'], 410);
        }

        $payment->update([
            'payment_method' => $request->payment_method,
            'status' => $request->payment_method === 'safepay' ? 'processing' : 'pending',
        ]);

        return $this->beginPaymentMethod($payment->fresh(), $request->payment_method);
    }

    public function handleCallback(Request $request): JsonResponse
    {
        if ($request->boolean('cancelled')) {
            $tracker = $request->query('tracker');
            if ($tracker) {
                $payment = Payment::where('safepay_tracker_token', $tracker)->first();
                if ($payment) {
                    $this->completion->markFailed($payment, 'Customer cancelled Safepay checkout');
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Payment cancelled',
            ]);
        }

        $tracker = $request->query('tracker');
        if (! $tracker) {
            return response()->json(['success' => false, 'message' => 'Missing tracker'], 422);
        }

        $payment = Payment::where('safepay_tracker_token', $tracker)->first();
        if (! $payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        try {
            $status = $this->safepay->fetchTrackerStatus($tracker);
            if ($this->safepay->isTrackerPaid($status)) {
                $payment = $this->completion->markCompleted($payment, ['callback' => $status]);

                return response()->json([
                    'success' => true,
                    'message' => 'Payment completed',
                    'data' => [
                        'payment' => $payment->loadMissing('order:id,order_number'),
                        'all_paid' => $this->completion->isGroupFullyPaid($payment),
                        'order_number' => $payment->order?->order_number,
                        'receipt_url' => $payment->receipt_url,
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Payment not yet completed',
                'data' => [
                    'payment' => $payment,
                    'tracker_state' => data_get($status, 'tracker.state'),
                ],
            ], 202);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to verify payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function handleWebhook(Request $request): JsonResponse
    {
        $raw = $request->getContent();
        $signature = $request->header('X-SFPY-SIGNATURE') ?? $request->header('x-sfpy-signature');

        if (! $this->safepay->verifyWebhookSignature($raw, $signature)) {
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 401);
        }

        $payload = $request->all();
        $tracker = data_get($payload, 'notification.tracker')
            ?? data_get($payload, 'data.tracker.token')
            ?? data_get($payload, 'tracker');

        $type = data_get($payload, 'type') ?? data_get($payload, 'event');

        if (! $tracker) {
            return response()->json(['success' => true, 'message' => 'Ignored — no tracker']);
        }

        $payment = Payment::where('safepay_tracker_token', $tracker)->first();
        if (! $payment) {
            return response()->json(['success' => true, 'message' => 'Ignored — unknown tracker']);
        }

        $state = data_get($payload, 'notification.state');
        $success = data_get($payload, 'success')
            ?? in_array($type, ['payment.succeeded', 'payment:succeeded', 'payment:created'], true)
            || $state === 'PAID';

        if ($success || str_contains((string) $type, 'succeeded')) {
            $ref = data_get($payload, 'notification.reference');
            if ($ref) {
                $payment->update(['safepay_reference_code' => (string) $ref]);
            }
            $this->completion->markCompleted($payment->fresh(), ['webhook' => $payload]);
        } elseif (str_contains((string) $type, 'failed') || $state === 'FAILED') {
            $this->completion->markFailed($payment, 'Safepay webhook reported failure');
        }

        return response()->json(['success' => true]);
    }

    public function confirmCashPayment(Request $request, Payment $payment): JsonResponse
    {
        if ($payment->payment_method !== 'cash') {
            return response()->json(['success' => false, 'message' => 'Not a cash payment'], 422);
        }

        if ($payment->status === 'completed') {
            return response()->json(['success' => true, 'data' => $payment]);
        }

        $payment = $this->completion->markCompleted($payment, [
            'confirmed_by' => $request->user()?->id,
            'confirmed_at' => now()->toIso8601String(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cash payment confirmed',
            'data' => [
                'payment' => $payment,
                'all_paid' => $this->completion->isGroupFullyPaid($payment),
            ],
        ]);
    }

    public function sessionBill(TableSession $session): JsonResponse
    {
        $orders = $session->orders()->with('items.menuItem')->get();
        $payments = $session->payments()->with('splitBillItems')->get();
        $draft = $orders->firstWhere('status', 'pending_payment');

        $claims = [];
        $splitType = null;
        if ($draft) {
            $claims = $this->currentClaimsPayload($draft);
            $splitPayments = $payments->where('order_id', $draft->id)->whereNotNull('split_group_id');
            if ($splitPayments->isNotEmpty()) {
                $splitType = $splitPayments->first()->payment_type === 'split_equal' ? 'equal' : 'itemized';
            } elseif ($claims !== []) {
                $splitType = 'itemized';
            }
        }

        $totalBill = $orders->where('status', '!=', 'cancelled')->sum('total_amount');
        $totalPaid = $payments->where('status', 'completed')->sum('amount');

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
                'draft_order' => $draft,
                'payments' => $payments,
                'claims' => $claims,
                'claimable_units' => $draft ? $this->splitBill->expandClaimableUnits($draft) : [],
                'split_type' => $splitType,
                'session_status' => $session->status,
                'participants' => $session->participants()->with('user')->whereNull('left_at')->get(),
                'total_bill' => $totalBill,
                'total_paid' => $totalPaid,
                'remaining' => max($totalBill - $totalPaid, 0),
                'payment_status' => $session->payment_status,
            ],
        ]);
    }

    public function paymentStatus(TableSession $session): JsonResponse
    {
        $payments = $session->payments()->latest()->get();

        return response()->json([
            'success' => true,
            'data' => [
                'payment_status' => $session->payment_status,
                'payments' => $payments,
            ],
        ]);
    }

    public function downloadReceipt(Payment $payment): JsonResponse
    {
        if (! $payment->receipt_url && $payment->status === 'completed') {
            $this->receipts->generateAndStore($payment);
            $payment->refresh();
        }

        $url = $this->receipts->presignedUrl($payment);

        return response()->json([
            'success' => true,
            'data' => [
                'receipt_url' => $url,
            ],
        ]);
    }

    public function pendingCashPayments(Request $request): JsonResponse
    {
        // Never trust a client-supplied restaurant_id — always use the operator's own.
        $restaurantId = $request->user()?->restaurant_id;

        $payments = Payment::query()
            ->with(['order.items.menuItem', 'order.table', 'session'])
            ->where('payment_method', 'cash')
            ->where('status', 'pending')
            ->whereHas('session', fn ($q) => $q->where('restaurant_id', $restaurantId))
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $payments,
        ]);
    }

    // ── Legacy stubs kept for compatibility ──

    public function initiate(Request $request): JsonResponse
    {
        return $this->checkout($request->merge(['mode' => 'full']));
    }

    public function splitBill(Request $request): JsonResponse
    {
        return $this->setupSplitBill($request);
    }

    public function confirm(Payment $payment): JsonResponse
    {
        return $this->confirmCashPayment(request(), $payment);
    }

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
            'data' => $payment->fresh(),
        ]);
    }

    // ── Helpers ──

    protected function beginPaymentMethod(Payment $payment, string $method): JsonResponse
    {
        if ($method === 'cash') {
            broadcast(new CashPaymentPending($payment));

            return response()->json([
                'success' => true,
                'message' => 'Cash payment registered — awaiting staff confirmation',
                'data' => [
                    'payment' => $payment,
                    'checkout_url' => null,
                ],
            ], 201);
        }

        // Safepay only allows a fixed set of metadata keys (e.g. order_id).
        // Payment lookup uses safepay_tracker_token, so payment_id is not needed here.
        $checkout = $this->safepay->createCheckoutForAmount((float) $payment->amount, [
            'order_id' => (string) $payment->order_id,
        ]);

        $payment->update([
            'safepay_tracker_token' => $checkout['tracker_token'],
            'status' => 'processing',
            'gateway_response' => $checkout['raw'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Safepay checkout ready',
            'data' => [
                'payment' => $payment->fresh(),
                'checkout_url' => $checkout['checkout_url'],
            ],
        ], 201);
    }

    protected function createDraftOrder(Request $request, TableSession $session): Order
    {
        $subtotal = 0;
        $itemsData = [];

        foreach ($request->items as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);
            $priced = $this->pricer->price($menuItem, $item['customizations'] ?? []);
            $unitPrice = (float) $menuItem->base_price + $priced['unit_price_adjustment'];
            $totalPrice = $unitPrice * $item['quantity'];
            $subtotal += $totalPrice;

            $itemsData[] = [
                'menu_item' => $menuItem,
                'quantity' => $item['quantity'],
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'customizations' => $priced['normalized_rows'],
            ];
        }

        $taxAmount = round($subtotal * 0.12, 2);
        $totalAmount = $subtotal + $taxAmount;

        $order = Order::create([
            'restaurant_id' => $session->restaurant_id,
            'table_id' => $request->table_id,
            'session_id' => $session->id,
            'user_id' => Auth::guard('sanctum')->id(),
            'order_number' => 'ORD-'.now()->format('Ymd').'-'.random_int(1000, 9999),
            'order_type' => 'dine_in',
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'status' => 'pending_payment',
            'special_instructions' => $request->special_instructions,
            'placed_at' => now(),
        ]);

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

        return $order->load('items.menuItem', 'items.customizations', 'table');
    }

    protected function resolveParticipant(TableSession $session, Request $request): ?SessionParticipant
    {
        if ($request->participant_id) {
            return SessionParticipant::where('session_id', $session->id)
                ->where('id', $request->participant_id)
                ->whereNull('left_at')
                ->first();
        }

        $userId = Auth::guard('sanctum')->id();
        if ($userId) {
            return SessionParticipant::where('session_id', $session->id)
                ->where('user_id', $userId)
                ->whereNull('left_at')
                ->first();
        }

        if ($request->device_id) {
            return SessionParticipant::where('session_id', $session->id)
                ->where('device_id', $request->device_id)
                ->whereNull('left_at')
                ->first();
        }

        return SessionParticipant::where('session_id', $session->id)
            ->whereNull('left_at')
            ->orderByDesc('is_host')
            ->first();
    }

    protected function currentClaimsPayload(Order $order): array
    {
        return SplitBillItem::whereIn('order_item_id', $order->items()->pluck('id'))
            ->get()
            ->map(fn (SplitBillItem $c) => [
                'id' => $c->id,
                'order_item_id' => $c->order_item_id,
                'unit_index' => $c->unit_index,
                'participant_id' => $c->participant_id,
                'amount' => (float) $c->amount,
                'payment_id' => $c->payment_id,
            ])
            ->values()
            ->all();
    }
}
