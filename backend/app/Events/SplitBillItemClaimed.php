<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SplitBillItemClaimed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $sessionId,
        public int $orderId,
        public int $orderItemId,
        public int $unitIndex,
        public ?int $participantId,
        public string $action,
        public float $amount,
        public array $claims,
        public array $claimableUnits = [],
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('split-bill:item-claimed')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'order_id' => $this->orderId,
            'order_item_id' => $this->orderItemId,
            'unit_index' => $this->unitIndex,
            'participant_id' => $this->participantId,
            'action' => $this->action,
            'amount' => $this->amount,
            'claims' => $this->claims,
            'claimable_units' => $this->claimableUnits,
        ];
    }
}
