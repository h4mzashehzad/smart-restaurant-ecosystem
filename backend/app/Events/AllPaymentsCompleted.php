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

    /**
     * @param  array<int, string|null>  $receiptUrls
     * @param  array<int, array{payment_id:int, participant_id:int|null, receipt_url:string|null}>  $receipts
     */
    public function __construct(
        public int $sessionId,
        public int $orderId,
        public float $totalAmount,
        public array $receiptUrls,
        public string $orderNumber,
        public array $receipts = [],
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('all-payments:completed')];
    }

    public function broadcastWith(): array
    {
        return [
            'session_id' => $this->sessionId,
            'order_id' => $this->orderId,
            'total_amount' => $this->totalAmount,
            'receipt_urls' => $this->receiptUrls,
            'receipts' => $this->receipts,
            'order_number' => $this->orderNumber,
        ];
    }
}
