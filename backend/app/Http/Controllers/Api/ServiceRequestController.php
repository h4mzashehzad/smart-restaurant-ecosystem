<?php

namespace App\Http\Controllers\Api;

use App\Events\ServiceRequestCreated;
use App\Events\ServiceRequestUpdated;
use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceRequestController extends Controller
{
    /**
     * Create a new service request (call waiter, request bill, etc.).
     * Public route — works for both authenticated users and guests with a session.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id'      => 'required|exists:tables,id',
            'session_id'    => 'nullable|exists:table_sessions,id',
            // Aligned to migration enum values
            'request_type'  => 'required|in:waiter_call,bill_request,water_refill,cutlery,complaint,other',
            'priority'      => 'nullable|in:low,medium,high,urgent',
            'message'       => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $serviceRequest = ServiceRequest::create([
            'restaurant_id' => $request->restaurant_id,
            'table_id'      => $request->table_id,
            'session_id'    => $request->session_id,
            // nullable — guests won't have an authenticated user
            'user_id'       => $request->user()?->id,
            'request_type'  => $request->request_type,
            'priority'      => $request->priority ?? 'medium',
            'message'       => $request->message,
            'status'        => 'pending',
            'created_at'    => now(),
        ]);

        // Broadcast to kitchen (KDS) and customer session via Redis pub/sub
        broadcast(new ServiceRequestCreated($serviceRequest));

        return response()->json([
            'success' => true,
            'message' => 'Service request created',
            'data'    => $serviceRequest->load(['table', 'user']),
        ], 201);
    }

    /**
     * List service requests (filtered by restaurant for staff).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ServiceRequest::with(['table', 'user', 'assignedStaff'])
            ->orderByDesc('created_at');

        if ($request->has('restaurant_id')) {
            $query->where('restaurant_id', $request->restaurant_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->paginate(20),
        ]);
    }

    /**
     * Acknowledge a service request (staff).
     */
    public function acknowledge(Request $request, int $id): JsonResponse
    {
        $serviceRequest = ServiceRequest::findOrFail($id);

        $serviceRequest->update([
            'status'          => 'acknowledged',
            'assigned_to'     => $request->user()->id,
            'acknowledged_at' => now(),
        ]);

        broadcast(new ServiceRequestUpdated($serviceRequest->fresh()));

        return response()->json([
            'success' => true,
            'message' => 'Service request acknowledged',
            'data'    => $serviceRequest->fresh(),
        ]);
    }

    /**
     * Resolve a service request (staff).
     */
    public function resolve(Request $request, int $id): JsonResponse
    {
        $serviceRequest = ServiceRequest::findOrFail($id);

        $serviceRequest->update([
            'status'      => 'resolved',
            'resolved_at' => now(),
        ]);

        broadcast(new ServiceRequestUpdated($serviceRequest->fresh()));

        return response()->json([
            'success' => true,
            'message' => 'Service request resolved',
            'data'    => $serviceRequest->fresh(),
        ]);
    }
}
