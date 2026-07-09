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
        public readonly int    $sessionId,
        public readonly string $splitType,
        public readonly string $splitGroupId,
        public readonly array  $participants,  // [{participant_id, amount, payment_method}]
        public readonly float  $totalAmount,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('split-bill:configured')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id'     => $this->sessionId,
            'split_type'     => $this->splitType,
            'split_group_id' => $this->splitGroupId,
            'participants'   => $this->participants,
            'total_amount'   => $this->totalAmount,
        ];
    }
}