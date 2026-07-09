<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PaymentFailed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int     $sessionId,
        public readonly string  $splitGroupId,
        public readonly ?int    $failedParticipantId,
        public readonly string  $reason,
        public readonly bool    $rollbackInitiated = false,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('payment:failed')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id'           => $this->sessionId,
            'split_group_id'       => $this->splitGroupId,
            'failed_participant_id'=> $this->failedParticipantId,
            'reason'               => $this->reason,
            'rollback_initiated'   => $this->rollbackInitiated,
        ];
    }
}