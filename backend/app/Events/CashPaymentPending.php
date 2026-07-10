<?php

namespace App\Events;

use App\Models\Payment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CashPaymentPending implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Payment $payment) {}

    public function broadcastOn(): array
    {
        return [new Channel('cash-payment:pending')];
    }

    public function broadcastWith(): array
    {
        $this->payment->loadMissing(['order.items.menuItem', 'order.table', 'session']);

        return [
            'payment' => [
                'id' => $this->payment->id,
                'amount' => (float) $this->payment->amount,
                'status' => $this->payment->status,
                'payment_method' => $this->payment->payment_method,
                'payment_type' => $this->payment->payment_type,
                'session_id' => $this->payment->session_id,
                'order_id' => $this->payment->order_id,
                'participant_id' => $this->payment->participant_id,
                'created_at' => optional($this->payment->created_at)?->toIso8601String(),
                'order' => $this->payment->order ? [
                    'id' => $this->payment->order->id,
                    'order_number' => $this->payment->order->order_number,
                    'table_id' => $this->payment->order->table_id,
                    'table_number' => $this->payment->order->table?->table_number,
                    'items_summary' => $this->payment->order->items->map(fn ($i) => [
                        'name' => $i->menuItem?->name,
                        'quantity' => $i->quantity,
                    ])->values()->all(),
                ] : null,
                'restaurant_id' => $this->payment->session?->restaurant_id
                    ?? $this->payment->order?->restaurant_id,
            ],
        ];
    }
}
