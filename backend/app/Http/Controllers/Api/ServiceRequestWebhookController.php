<?php

namespace App\Http\Controllers\Api;

use App\Events\ServiceRequestUpdated;
use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Called by the Socket.io server with the authenticated operator token when kitchen staff
 * acknowledge or resolve a waiter-assistance request directly from the KDS.
 */
class ServiceRequestWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'request_id' => 'required|exists:service_requests,id',
            'action' => 'required|in:acknowledge,resolve',
        ]);

        $serviceRequest = ServiceRequest::where('restaurant_id', $request->user()->restaurant_id)->findOrFail($validated['request_id']);

        if ($validated['action'] === 'acknowledge') {
            $serviceRequest->update([
                'status' => 'acknowledged',
                'acknowledged_at' => now(),
            ]);
        } else {
            $serviceRequest->update([
                'status' => 'resolved',
                'resolved_at' => now(),
            ]);
        }

        // Broadcast update to kitchen room + customer session room via Redis
        broadcast(new ServiceRequestUpdated($serviceRequest->fresh()));

        return response()->json([
            'success' => true,
            'data' => $serviceRequest->fresh(),
        ]);
    }
}
