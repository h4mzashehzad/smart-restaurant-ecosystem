<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CashPaymentPending implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $paymentId,
        public readonly int    $sessionId,
        public readonly int    $restaurantId,
        public readonly ?int   $participantId,
        public readonly float  $amount,
        public readonly string $tableNumber,
        public readonly ?string $splitGroupId = null,
        public readonly string $paymentType  = 'full',
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('cash-payment:pending')];
    }

    public function broadcastWith(): array
    {
        return [
            'payment_id'     => $this->paymentId,
            'session_id'     => $this->sessionId,
            'restaurant_id'  => $this->restaurantId,
            'participant_id' => $this->participantId,
            'amount'         => $this->amount,
            'table_number'   => $this->tableNumber,
            'split_group_id' => $this->splitGroupId,
            'payment_type'   => $this->paymentType,
        ];
    }
}