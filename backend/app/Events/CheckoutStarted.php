<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CheckoutStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $sessionId,
        public int $orderId,
        public string $orderNumber,
        public string $mode,
        public float $subtotal,
        public float $taxAmount,
        public float $totalAmount,
        public array $claimableUnits,
        public ?int $initiatorParticipantId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('checkout:started')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'order_id' => $this->orderId,
            'order_number' => $this->orderNumber,
            'mode' => $this->mode,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->taxAmount,
            'total_amount' => $this->totalAmount,
            'claimable_units' => $this->claimableUnits,
            'initiator_participant_id' => $this->initiatorParticipantId,
        ];
    }
}
