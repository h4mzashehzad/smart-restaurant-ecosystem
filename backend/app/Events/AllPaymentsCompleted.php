<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AllPaymentsCompleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int    $sessionId,
        public readonly int    $orderId,
        public readonly float  $totalAmount,
        public readonly string $splitGroupId,
        public readonly array  $receiptUrls,   // [participant_id => url]
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('all-payments:completed')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id'     => $this->sessionId,
            'order_id'       => $this->orderId,
            'total_amount'   => $this->totalAmount,
            'split_group_id' => $this->splitGroupId,
            'receipt_urls'   => $this->receiptUrls,
        ];
    }
}