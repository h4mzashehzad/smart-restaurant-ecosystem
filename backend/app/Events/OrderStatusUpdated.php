<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $orderId;
    public string $status;
    public int $restaurantId;
    public ?int $tableId;

    /**
     * Create a new event instance.
     */
    public function __construct(int $orderId, string $status, int $restaurantId, ?int $tableId = null)
    {
        $this->orderId      = $orderId;
        $this->status       = $status;
        $this->restaurantId = $restaurantId;
        $this->tableId      = $tableId;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('order:status:updated'),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'order_id'      => $this->orderId,
            'status'        => $this->status,
            'restaurant_id' => $this->restaurantId,
            'table_id'      => $this->tableId,
        ];
    }
}
