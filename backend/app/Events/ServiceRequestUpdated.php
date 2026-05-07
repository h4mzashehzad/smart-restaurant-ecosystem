<?php

namespace App\Events;

use App\Models\ServiceRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ServiceRequestUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $requestId;
    public string $status;
    public int $restaurantId;
    public ?int $sessionId;
    public ?string $acknowledgedAt;
    public ?string $resolvedAt;

    public function __construct(ServiceRequest $serviceRequest)
    {
        $this->requestId      = $serviceRequest->id;
        $this->status         = $serviceRequest->status;
        $this->restaurantId   = $serviceRequest->restaurant_id;
        $this->sessionId      = $serviceRequest->session_id;
        $this->acknowledgedAt = $serviceRequest->acknowledged_at?->toISOString();
        $this->resolvedAt     = $serviceRequest->resolved_at?->toISOString();
    }

    public function broadcastOn(): array
    {
        return [
            new Channel("service-requests.restaurant_{$this->restaurantId}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'request_id'      => $this->requestId,
            'status'          => $this->status,
            'restaurant_id'   => $this->restaurantId,
            'session_id'      => $this->sessionId,
            'acknowledged_at' => $this->acknowledgedAt,
            'resolved_at'     => $this->resolvedAt,
        ];
    }
}
