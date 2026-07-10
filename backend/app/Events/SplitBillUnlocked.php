<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SplitBillUnlocked implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $sessionId,
        public int $orderId,
        public array $claims = [],
        public array $claimableUnits = [],
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('split-bill:unlocked')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'order_id' => $this->orderId,
            'claims' => $this->claims,
            'claimable_units' => $this->claimableUnits,
        ];
    }
}
