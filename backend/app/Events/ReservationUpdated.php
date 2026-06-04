<?php

namespace App\Events;

use App\Models\Reservation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $reservation;
    public string $action;

    public function __construct(Reservation $reservation, string $action)
    {
        $reservation->load(['table', 'user']);
        $this->reservation = $reservation->toArray();
        $this->action = $action;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('reservation:updated'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'reservation'   => $this->reservation,
            'restaurant_id' => $this->reservation['restaurant_id'],
            'action'        => $this->action,
        ];
    }
}
