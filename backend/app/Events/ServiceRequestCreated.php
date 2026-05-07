<?php

namespace App\Events;

use App\Models\ServiceRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ServiceRequestCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public array $serviceRequest;
    public int $restaurantId;
    public ?int $sessionId;

    public function __construct(ServiceRequest $serviceRequest)
    {
        $serviceRequest->load(['table', 'user']);

        $this->serviceRequest = $serviceRequest->toArray();
        $this->restaurantId   = $serviceRequest->restaurant_id;
        $this->sessionId      = $serviceRequest->session_id;
    }

    /**
     * Broadcast on the restaurant-scoped service-requests channel.
     * The socket server subscribes to 'laravel-database-service-requests.*'
     * and fans out to the kitchen room + the customer session room.
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("service-requests.restaurant_{$this->restaurantId}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'service_request' => $this->serviceRequest,
            'restaurant_id'   => $this->restaurantId,
            'session_id'      => $this->sessionId,
        ];
    }
}
