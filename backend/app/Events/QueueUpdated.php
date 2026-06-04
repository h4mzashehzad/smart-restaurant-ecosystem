<?php

namespace App\Events;

use App\Models\QueueEntry;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class QueueUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $entry;
    public string $action;

    public function __construct(QueueEntry $entry, string $action)
    {
        $this->entry = $entry->toArray();
        $this->action = $action;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('queue:updated'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'entry'         => $this->entry,
            'restaurant_id' => $this->entry['restaurant_id'],
            'action'        => $this->action,
        ];
    }
}
