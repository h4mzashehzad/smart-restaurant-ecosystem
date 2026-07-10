<?php

namespace App\Services;

use App\Events\AllPaymentsCompleted;
use App\Events\OrderCreated;
use App\Events\PaymentCompleted;
use App\Events\PaymentFailed;
use App\Models\Order;
use App\Models\Payment;
use App\Models\TableSession;
use Illuminate\Support\Facades\DB;

class PaymentCompletionService
{
    public function __construct(
        protected ReceiptService $receiptService,
    ) {}

    public function markCompleted(Payment $payment, array $gatewayResponse = []): Payment
    {
        if ($payment->status === 'completed') {
            return $payment;
        }

        return DB::transaction(function () use ($payment, $gatewayResponse) {
            $payment->refresh();

            if ($payment->status === 'completed') {
                return $payment;
            }

            $payment->update([
                'status' => 'completed',
                'paid_at' => now(),
                'gateway_response' => array_merge($payment->gateway_response ?? [], $gatewayResponse),
            ]);

            $this->receiptService->generateAndStore($payment->fresh());
            $payment = $payment->fresh();

            $this->syncSessionPaymentStatus($payment);
            broadcast(new PaymentCompleted($payment));

            if ($this->isGroupFullyPaid($payment)) {
                $this->confirmOrderAndNotify($payment);
            }

            return $payment;
        });
    }

    public function markFailed(Payment $payment, string $reason = 'Payment failed'): Payment
    {
        if (in_array($payment->status, ['completed', 'refunded'], true)) {
            return $payment;
        }

        $payment->update([
            'status' => 'failed',
            'gateway_response' => array_merge($payment->gateway_response ?? [], [
                'failure_reason' => $reason,
            ]),
        ]);

        broadcast(new PaymentFailed(
            sessionId: (int) $payment->session_id,
            splitGroupId: $payment->split_group_id,
            failedParticipantId: $payment->participant_id,
            reason: $reason,
            paymentId: $payment->id,
        ));

        return $payment->fresh();
    }

    public function isGroupFullyPaid(Payment $payment): bool
    {
        if (! $payment->split_group_id) {
            return $payment->status === 'completed';
        }

        $group = Payment::query()->splitGroup($payment->split_group_id)->get();

        return $group->isNotEmpty() && $group->every(fn (Payment $p) => $p->status === 'completed');
    }

    protected function syncSessionPaymentStatus(Payment $payment): void
    {
        $session = TableSession::find($payment->session_id);
        if (! $session) {
            return;
        }

        if ($payment->split_group_id) {
            $group = Payment::query()->splitGroup($payment->split_group_id)->get();
            $completed = $group->where('status', 'completed')->count();
            $total = $group->count();

            $status = $completed === 0 ? 'unpaid' : ($completed >= $total ? 'paid' : 'partial');
        } else {
            $status = $payment->status === 'completed' ? 'paid' : 'unpaid';
        }

        $session->update(['payment_status' => $status]);
    }

    protected function confirmOrderAndNotify(Payment $payment): void
    {
        $order = Order::with(['items.menuItem', 'items.customizations', 'table', 'user', 'restaurant'])
            ->find($payment->order_id);

        if (! $order) {
            return;
        }

        if ($order->status === 'pending_payment') {
            $order->update([
                'status' => 'confirmed',
                'confirmed_at' => now(),
            ]);
            $order = $order->fresh(['items.menuItem', 'items.customizations', 'table', 'user', 'restaurant']);
            broadcast(new OrderCreated($order));
        }

        $session = TableSession::find($payment->session_id);
        if ($session) {
            $session->update([
                'payment_status' => 'paid',
                'status' => $session->status === 'checkout_pending' ? 'active' : $session->status,
                'total_amount' => (float) $session->total_amount + (float) $order->total_amount,
            ]);
        }

        $receiptUrls = Payment::query()
            ->when(
                $payment->split_group_id,
                fn ($q) => $q->splitGroup($payment->split_group_id),
                fn ($q) => $q->where('id', $payment->id)
            )
            ->pluck('receipt_url')
            ->filter()
            ->values()
            ->all();

        broadcast(new AllPaymentsCompleted(
            sessionId: (int) $payment->session_id,
            orderId: (int) $order->id,
            totalAmount: (float) $order->total_amount,
            receiptUrls: $receiptUrls,
            orderNumber: $order->order_number,
        ));
    }
}
