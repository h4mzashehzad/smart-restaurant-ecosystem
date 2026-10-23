<?php

namespace App\Services;

use App\Events\OrderStatusUpdated;
use App\Events\ReservationUpdated;
use App\Jobs\SendReservationMail;
use App\Models\PaymentRefund;
use App\Models\Reservation;
use App\Models\Table;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReservationRefundService
{
    public function __construct(private SafepayService $safepay, private LoyaltyService $loyalty) {}

    public function cancel(Reservation $booking, string $actor = 'customer', ?string $reason = null): Reservation
    {
        DB::transaction(function () use ($booking, $actor, $reason): void {
            Table::query()->lockForUpdate()->find($booking->table_id);
            $reservation = Reservation::query()->lockForUpdate()->findOrFail($booking->id);
            $order = $reservation->preorder()->lockForUpdate()->first();
            $payment = $order?->payments()->lockForUpdate()->first();
            if ($reservation->status === 'cancelled' && (! $payment?->paid_at || $reservation->refunds()->exists())) {
                return;
            }
            if ($actor !== 'restaurant') {
                abort_unless(in_array($reservation->status, ['pending', 'confirmed'], true), 409, 'This reservation can no longer be cancelled.');
                abort_if($payment?->paid_at && (! $reservation->cancellation_deadline || now()->gt($reservation->cancellation_deadline)), 409, 'Online cancellation closes two hours before arrival. Please contact the restaurant.');
            }
            $reservation->update(['status' => 'cancelled', 'cancelled_at' => $reservation->cancelled_at ?? now(), 'cancelled_by' => $actor, 'cancellation_reason' => $reason, 'checkout_expires_at' => null]);
            if ($order) {
                $order->update(['status' => 'cancelled']);
                app(ReservationPreorderService::class)->syncDiningSession($order);
                $this->loyalty->reversePoints($order);
                if ($payment?->paid_at) {
                    $paid = (int) round((float) $payment->amount * 100);
                    $fee = $actor === 'restaurant' ? 0 : (int) round($paid * $reservation->cancellation_fee_percent / 100);
                    PaymentRefund::firstOrCreate(['payment_id' => $payment->id], ['reservation_id' => $reservation->id, 'amount_paisa' => $paid - $fee, 'fee_paisa' => $fee, 'request_key' => (string) Str::uuid(), 'status' => 'pending']);
                }
                DB::afterCommit(fn () => broadcast(new OrderStatusUpdated($order->id, 'cancelled', $order->restaurant_id, $order->session_id ? $order->table_id : null)));
            }
            DB::afterCommit(function () use ($reservation): void {
                event(new ReservationUpdated($reservation->fresh(), 'cancelled'));
                SendReservationMail::dispatch($reservation->id, 'cancelled');
            });
        }, 3);

        return $booking->fresh();
    }

    public function process(PaymentRefund $refund): void
    {
        $claimed = PaymentRefund::query()->whereKey($refund->id)->where('status', 'pending')->update(['status' => 'processing', 'submitted_at' => now()]);
        if (! $claimed) {
            return;
        }
        $refund->refresh()->load('payment');
        try {
            $result = $this->safepay->refundAmount($refund->payment->safepay_tracker_token, $refund->amount_paisa);
            $refund->update(['gateway_response' => $result]);
            $state = data_get($result, 'tracker.state') ?? data_get($result, 'state');
            if (($refund->fee_paisa === 0 && $state === 'TRACKER_REFUNDED') || ($refund->fee_paisa > 0 && $state === 'TRACKER_PARTIAL_REFUND')) {
                $this->succeed($refund);
            } else {
                $refund->update(['status' => 'needs_review', 'last_error' => 'Safepay accepted the request without a final refund state. Reconcile before retrying.']);
            }
        } catch (\Illuminate\Http\Client\RequestException $e) {
            $refund->update(['status' => $e->response->status() < 500 ? 'failed' : 'needs_review', 'last_error' => 'Safepay refund request returned HTTP '.$e->response->status().'.']);
            report($e);
        } catch (\Throwable $e) {
            $refund->update(['status' => 'needs_review', 'last_error' => 'The gateway response was uncertain. Reconcile before retrying.']);
            report($e);
        }
    }

    public function reconcile(PaymentRefund $refund): void
    {
        if ($refund->status === 'succeeded') {
            return;
        }
        try {
            $data = $this->safepay->fetchTrackerStatus($refund->payment->safepay_tracker_token);
            $state = data_get($data, 'tracker.state') ?? data_get($data, 'state');
            $returned = data_get($data, 'refunded_amount.amount') ?? data_get($data, 'tracker.refunded_amount.amount');
            if (($returned !== null && (int) $returned === $refund->amount_paisa)
                || ($state === 'TRACKER_REFUNDED' && $refund->fee_paisa === 0)) {
                $refund->update(['gateway_response' => $data]);
                $this->succeed($refund);
            } elseif ($refund->status === 'processing' && $refund->submitted_at?->lt(now()->subMinutes(5))) {
                $refund->update(['status' => 'needs_review', 'last_error' => 'Refund outcome needs verification with Safepay. No automatic resubmission was made.']);
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function succeed(PaymentRefund $refund): void
    {
        DB::transaction(function () use ($refund): void {
            $locked = PaymentRefund::query()->lockForUpdate()->findOrFail($refund->id);
            if ($locked->status === 'succeeded') {
                return;
            }
            $locked->update(['status' => 'succeeded', 'completed_at' => now(), 'last_error' => null]);
            if ($locked->fee_paisa === 0) {
                $locked->payment->update(['status' => 'refunded']);
            }
            DB::afterCommit(function () use ($locked): void {
                SendReservationMail::dispatch($locked->reservation_id, 'refund');
                event(new ReservationUpdated($locked->reservation, 'refund_updated'));
            });
        });
    }
}
