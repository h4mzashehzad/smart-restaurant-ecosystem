<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SessionParticipant;
use App\Models\Table;
use App\Models\TableSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use App\Events\SessionStateChanged;
class SessionController extends Controller
{
    /**
     * Start a new dining session for a table.
     * Supports both authenticated users and guests (via X-Device-Id header).
     */
    public function start(Request $request, Table $table): JsonResponse
    {
        // Ensure no active session exists
        if ($table->currentSession) {
            return response()->json([
                'success' => false,
                'message' => 'Table already has an active session',
                'data'    => ['existing_session_id' => $table->current_session_id],
            ], 409);
        }

        $session = TableSession::create([
            'table_id'      => $table->id,
            'restaurant_id' => $table->restaurant_id,
            'session_token' => Str::random(32),
            'status'        => 'active',
            'started_at'    => now(),
        ]);

        // Link the session back to the table
        $table->update(['status' => 'occupied', 'current_session_id' => $session->id]);

        // Add current user as first participant (host)
        $user = Auth::guard('sanctum')->user();
        SessionParticipant::create([
            'session_id' => $session->id,
            'user_id'    => $user?->id, // null for guests
            'device_id'  => $request->header('X-Device-Id'),
            'is_host'    => true,
            'joined_at'  => now(),
        ]);

        event(new SessionStateChanged($session->id));

        return response()->json([
            'success' => true,
            'message' => 'Session started',
            'data'    => $session->load(['table', 'participants.user']),
        ], 201);
    }

    /**
     * Join an existing session.
     * Supports both authenticated users and guests (via X-Device-Id header).
     */
    public function join(Request $request, TableSession $session): JsonResponse
    {
        if ($session->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Session is no longer active',
            ], 409);
        }

        $user     = Auth::guard('sanctum')->user();
        $userId   = $user?->id;
        $deviceId = $request->header('X-Device-Id');

        // Check if already a participant (by user_id OR device_id)
        $existing = $session->participants()
            ->where(function ($q) use ($userId, $deviceId) {
                if ($userId) {
                    $q->where('user_id', $userId);
                }
                if ($deviceId) {
                    $q->orWhere('device_id', $deviceId);
                }
            })
            ->whereNull('left_at')
            ->first();

        if ($existing) {
            // Already in session — return current state so the frontend can continue
            return response()->json([
                'success' => true,
                'message' => 'Already in this session',
                'data'    => $session->load(['table', 'participants.user']),
            ]);
        }

        SessionParticipant::create([
            'session_id' => $session->id,
            'user_id'    => $userId,
            'device_id'  => $deviceId,
            'is_host'    => false,
            'joined_at'  => now(),
        ]);

        event(new SessionStateChanged($session->id));

        return response()->json([
            'success' => true,
            'message' => 'Joined session successfully',
            'data'    => $session->load(['table', 'participants.user']),
        ]);
    }

    /**
     * Get session details.
     */
    public function show(TableSession $session): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $session->load(['table', 'participants.user', 'orders.items.menuItem']),
        ]);
    }

    /**
     * Get session participants.
     */
    public function participants(TableSession $session): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $session->participants()->with('user')->whereNull('left_at')->get(),
        ]);
    }

    /**
     * Leave a session.
     */
    public function leave(Request $request, TableSession $session): JsonResponse
    {
        $user     = Auth::guard('sanctum')->user();
        $userId   = $user?->id;
        $deviceId = $request->header('X-Device-Id');

        $participant = $session->participants()
            ->where(function ($q) use ($userId, $deviceId) {
                if ($userId) {
                    $q->where('user_id', $userId);
                }
                if ($deviceId) {
                    $q->orWhere('device_id', $deviceId);
                }
            })
            ->whereNull('left_at')
            ->first();

        if (! $participant) {
            return response()->json([
                'success' => false,
                'message' => 'You are not in this session',
            ], 404);
        }

        $participant->update(['left_at' => now()]);

        event(new SessionStateChanged($session->id));

        return response()->json([
            'success' => true,
            'message' => 'Left session successfully',
        ]);
    }

    /**
     * End a session (host only).
     */
    public function end(Request $request, TableSession $session): JsonResponse
    {
        $user     = Auth::guard('sanctum')->user();
        $userId   = $user?->id;
        $deviceId = $request->header('X-Device-Id');

        // Verify the user is the host
        $host = $session->participants()
            ->where(function ($q) use ($userId, $deviceId) {
                if ($userId) {
                    $q->where('user_id', $userId);
                }
                if ($deviceId) {
                    $q->orWhere('device_id', $deviceId);
                }
            })
            ->where('is_host', true)
            ->first();

        if (! $host) {
            return response()->json([
                'success' => false,
                'message' => 'Only the session host can end the session',
            ], 403);
        }

        $session->update([
            'status'   => 'completed',
            'ended_at' => now(),
        ]);

        // Free up the table
        $session->table->update([
            'status'             => 'available',
            'current_session_id' => null,
        ]);

        event(new SessionStateChanged($session->id));

        return response()->json([
            'success' => true,
            'message' => 'Session ended successfully',
        ]);
    }
}
