<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int     $paymentId,
        public readonly int     $sessionId,
        public readonly ?int    $participantId,
        public readonly float   $amount,
        public readonly string  $paymentMethod,
        public readonly ?string $splitGroupId,
        public readonly ?string $receiptUrl = null,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('payment:completed')];
    }

    public function broadcastWith(): array
    {
        return [
            'payment_id'     => $this->paymentId,
            'session_id'     => $this->sessionId,
            'participant_id' => $this->participantId,
            'amount'         => $this->amount,
            'payment_method' => $this->paymentMethod,
            'split_group_id' => $this->splitGroupId,
            'receipt_url'    => $this->receiptUrl,
        ];
    }
}