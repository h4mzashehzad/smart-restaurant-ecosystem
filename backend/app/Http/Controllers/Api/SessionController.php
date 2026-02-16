<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SessionParticipant;
use App\Models\Table;
use App\Models\TableSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SessionController extends Controller
{
    /**
     * Start a new dining session for a table.
     */
    public function start(Request $request, Table $table): JsonResponse
    {
        // Ensure no active session exists
        if ($table->currentSession) {
            return response()->json([
                'success' => false,
                'message' => 'Table already has an active session',
            ], 409);
        }

        $session = TableSession::create([
            'table_id'      => $table->id,
            'restaurant_id' => $table->restaurant_id,
            'session_code'  => strtoupper(Str::random(8)),
            'status'        => 'active',
            'started_at'    => now(),
        ]);

        // Add current user as first participant
        SessionParticipant::create([
            'session_id'  => $session->id,
            'user_id'     => $request->user()->id,
            'device_id'   => $request->header('X-Device-Id'),
            'is_host'     => true,
            'joined_at'   => now(),
        ]);

        // Mark table as occupied
        $table->update(['status' => 'occupied']);

        return response()->json([
            'success' => true,
            'message' => 'Session started',
            'data'    => $session->load('participants'),
        ], 201);
    }

    /**
     * Join an existing session.
     */
    public function join(Request $request, TableSession $session): JsonResponse
    {
        if ($session->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Session is no longer active',
            ], 409);
        }

        // Check if already a participant
        $existing = $session->participants()
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You are already in this session',
            ], 409);
        }

        $participant = SessionParticipant::create([
            'session_id' => $session->id,
            'user_id'    => $request->user()->id,
            'device_id'  => $request->header('X-Device-Id'),
            'is_host'    => false,
            'joined_at'  => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Joined session successfully',
            'data'    => $session->load('participants'),
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
            'data'    => $session->participants()->with('user')->get(),
        ]);
    }

    /**
     * Leave a session.
     */
    public function leave(Request $request, TableSession $session): JsonResponse
    {
        $participant = $session->participants()
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $participant) {
            return response()->json([
                'success' => false,
                'message' => 'You are not in this session',
            ], 404);
        }

        $participant->update(['left_at' => now()]);

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
        // Verify the user is the host
        $host = $session->participants()
            ->where('user_id', $request->user()->id)
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
        $session->table->update(['status' => 'available']);

        return response()->json([
            'success' => true,
            'message' => 'Session ended successfully',
        ]);
    }
}
