<?php

namespace App\Jobs;

use App\Mail\ReservationConfirmed;
use App\Models\Reservation;
use App\Services\ReceiptService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;

class SendReservationMail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(public int $reservationId, public string $notification = 'booking') {}

    public function handle(ReceiptService $receipts): void
    {
        Cache::lock('reservation-mail:'.$this->reservationId.':'.$this->notification, 120)->block(5, function () use ($receipts): void {
            $reservation = Reservation::with(['table', 'restaurant', 'preorder.items', 'preorder.payments', 'refunds'])->findOrFail($this->reservationId);
            $refund = $reservation->refunds->first();
            if (($this->notification === 'booking' && ($reservation->confirmation_sent_at || $reservation->status === 'cancelled' || $reservation->checkout_state === 'pending'))
                || ($this->notification === 'cancelled' && $reservation->cancellation_sent_at)
                || ($this->notification === 'refund' && (! $refund || $refund->notified_at))) {
                return;
            }
            $payment = $reservation->preorder?->payments->first();
            if ($payment?->paid_at && ! $payment->receipt_url) {
                $receipts->generateAndStore($payment);
                $reservation->load('preorder.payments');
            }
            if ($reservation->guest_email) {
                Mail::to($reservation->guest_email)->send(new ReservationConfirmed($reservation, $this->notification));
            }
            if ($this->notification === 'booking') {
                $reservation->update(['confirmation_sent_at' => now()]);
            } elseif ($this->notification === 'cancelled') {
                $reservation->update(['cancellation_sent_at' => now()]);
            } else {
                $refund?->update(['notified_at' => now()]);
            }
        });
    }
}
