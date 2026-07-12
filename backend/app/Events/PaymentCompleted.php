<?php

namespace App\Events;

use App\Models\Payment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Payment $payment) {}

    public function broadcastOn(): array
    {
        return [new Channel('payment:completed')];
    }

    public function broadcastWith(): array
    {
        $this->payment->loadMissing('order:id,restaurant_id');

        return [
            'payment_id' => $this->payment->id,
            'participant_id' => $this->payment->participant_id,
            'amount' => (float) $this->payment->amount,
            'method' => $this->payment->payment_method,
            'session_id' => $this->payment->session_id,
            'split_group_id' => $this->payment->split_group_id,
            'order_id' => $this->payment->order_id,
            'restaurant_id' => $this->payment->order?->restaurant_id,
            'status' => $this->payment->status,
            'receipt_url' => $this->payment->receipt_url,
        ];
    }
}
