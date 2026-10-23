<?php

namespace App\Console\Commands;

use App\Jobs\SendReservationMail;
use App\Models\Payment;
use App\Models\PaymentRefund;
use App\Models\Reservation;
use App\Services\ReservationPreorderService;
use App\Services\ReservationRefundService;
use App\Services\SafepayService;
use Illuminate\Console\Command;

class ProcessReservationPreorders extends Command
{
    protected $signature = 'reservations:process-preorders';

    protected $description = 'Release due paid preorders, reconcile payments and refunds, and recover reservation emails';

    public function handle(ReservationPreorderService $preorders, ReservationRefundService $refunds, SafepayService $gateway): int
    {
        Payment::query()->whereHas('order', fn ($q) => $q->whereNotNull('reservation_id'))
            ->whereNull('paid_at')->whereNotNull('safepay_tracker_token')->where('created_at', '>=', now()->subDays(2))
            ->each(function (Payment $payment) use ($gateway, $preorders): void {
                try {
                    $data = $gateway->fetchTrackerStatus($payment->safepay_tracker_token);
                    if ($gateway->isTrackerPaid($data)) {
                        $preorders->complete($payment, ['reconciliation' => $data]);
                    }
                } catch (\Throwable $e) {
                    report($e);
                }
            });
        Reservation::query()->where('checkout_state', 'pending')->where('checkout_expires_at', '<=', now())->update(['checkout_state' => 'expired']);
        $count = $preorders->releaseDue();
        PaymentRefund::query()->where('status', 'pending')->each(fn (PaymentRefund $refund) => $refunds->process($refund));
        PaymentRefund::query()->whereIn('status', ['processing', 'needs_review'])->each(fn (PaymentRefund $refund) => $refunds->reconcile($refund));
        Reservation::query()->whereNull('confirmation_sent_at')->whereIn('checkout_state', ['table_only', 'paid'])->whereNotIn('status', ['cancelled', 'no_show'])->each(fn (Reservation $r) => SendReservationMail::dispatch($r->id));
        Reservation::query()->where('status', 'cancelled')->whereNull('cancellation_sent_at')->each(fn (Reservation $r) => SendReservationMail::dispatch($r->id, 'cancelled'));
        PaymentRefund::query()->where('status', 'succeeded')->whereNull('notified_at')->each(fn (PaymentRefund $r) => SendReservationMail::dispatch($r->reservation_id, 'refund'));
        $this->info("Released {$count} reservation preorders.");

        return self::SUCCESS;
    }
}
