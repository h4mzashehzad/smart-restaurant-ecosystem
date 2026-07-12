<?php

namespace App\Http\Controllers\Api;

use App\Events\ServiceRequestCreated;
use App\Events\ServiceRequestUpdated;
use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceRequestController extends Controller
{
    use ResolvesRestaurant;

    /**
     * Create a new service request (call waiter, request bill, etc.).
     * Public route — works for both authenticated users and guests with a session.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id' => 'required|exists:tables,id',
            'session_id' => 'nullable|exists:table_sessions,id',
            // Aligned to migration enum values
            'request_type' => 'required|in:waiter_call,bill_request,water_refill,cutlery,complaint,other',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $serviceRequest = ServiceRequest::create([
            'restaurant_id' => $request->restaurant_id,
            'table_id' => $request->table_id,
            'session_id' => $request->session_id,
            // nullable — guests won't have an authenticated user
            'user_id' => $request->user()?->id,
            'request_type' => $request->request_type,
            'priority' => $request->priority ?? 'medium',
            'message' => $request->message,
            'status' => 'pending',
            'created_at' => now(),
        ]);

        // Broadcast to kitchen (KDS) and customer session via Redis pub/sub
        broadcast(new ServiceRequestCreated($serviceRequest));

        return response()->json([
            'success' => true,
            'message' => 'Service request created',
            'data' => $serviceRequest->load(['table', 'user']),
        ], 201);
    }

    /**
     * List service requests. Staff/admin are always scoped to their own
     * restaurant (never a client-supplied restaurant_id). Supports a
     * status[] array filter, date range, type, priority, and a
     * `view=current|history` shortcut.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ServiceRequest::with(['table', 'user', 'assignedStaff'])
            ->orderByDesc('created_at');

        $user = $request->user();

        if ($user && in_array($user->role, ['admin', 'staff'], true)) {
            $query->where('restaurant_id', $this->restaurantId($request));
        } elseif ($request->filled('restaurant_id')) {
            $query->where('restaurant_id', $request->restaurant_id);
        }

        if ($request->filled('status')) {
            $statuses = is_array($request->status)
                ? $request->status
                : explode(',', (string) $request->status);

            $query->whereIn('status', $statuses);
        }

        if ($request->input('view') === 'history') {
            $query->whereIn('status', ['resolved', 'cancelled']);
        } elseif ($request->input('view') === 'current') {
            $query->whereIn('status', ['pending', 'acknowledged', 'in_progress']);
        }

        if ($request->filled('request_type')) {
            $query->where('request_type', $request->request_type);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate((int) $request->input('per_page', 20)),
        ]);
    }

    /**
     * Acknowledge a service request (staff) — scoped to the staff member's own restaurant.
     */
    public function acknowledge(Request $request, int $id): JsonResponse
    {
        $serviceRequest = ServiceRequest::where('restaurant_id', $this->restaurantId($request))->findOrFail($id);

        $serviceRequest->update([
            'status' => 'acknowledged',
            'assigned_to' => $request->user()->id,
            'acknowledged_at' => now(),
        ]);

        broadcast(new ServiceRequestUpdated($serviceRequest->fresh()));

        return response()->json([
            'success' => true,
            'message' => 'Service request acknowledged',
            'data' => $serviceRequest->fresh(),
        ]);
    }

    /**
     * Resolve a service request (staff) — scoped to the staff member's own restaurant.
     */
    public function resolve(Request $request, int $id): JsonResponse
    {
        $serviceRequest = ServiceRequest::where('restaurant_id', $this->restaurantId($request))->findOrFail($id);

        $serviceRequest->update([
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        broadcast(new ServiceRequestUpdated($serviceRequest->fresh()));

        return response()->json([
            'success' => true,
            'message' => 'Service request resolved',
            'data' => $serviceRequest->fresh(),
        ]);
    }
}
