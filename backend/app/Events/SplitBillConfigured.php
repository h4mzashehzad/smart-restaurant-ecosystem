<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SplitBillConfigured implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $sessionId,
        public string $splitType,
        public string $splitGroupId,
        public array $participants,
        public int $orderId,
        public string $orderNumber = '',
        public float $subtotal = 0,
        public float $taxAmount = 0,
        public float $totalAmount = 0,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('split-bill:configured')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'split_type' => $this->splitType,
            'split_group_id' => $this->splitGroupId,
            'participants' => $this->participants,
            'order_id' => $this->orderId,
            'order_number' => $this->orderNumber,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->taxAmount,
            'total_amount' => $this->totalAmount,
        ];
    }
}
