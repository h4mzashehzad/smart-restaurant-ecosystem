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
        public int $sessionId,
        public ?string $splitGroupId,
        public ?int $failedParticipantId,
        public string $reason,
        public int $paymentId,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('payment:failed')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'split_group_id' => $this->splitGroupId,
            'failed_participant_id' => $this->failedParticipantId,
            'reason' => $this->reason,
            'payment_id' => $this->paymentId,
        ];
    }
}
