<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\SessionParticipant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class TableController extends Controller
{
    /**
     * Scan QR code and return table info + active session.
     * Public endpoint — works for guests and authenticated users.
     */
    public function scan(string $qrCode): JsonResponse
    {
        $table = Table::with(['restaurant', 'currentSession.participants.user'])
            ->where('qr_code', $qrCode)
            ->first();

        if (! $table) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid QR code',
            ], 404);
        }

        $activeSession = $table->currentSession;

        return response()->json([
            'success' => true,
            'data'    => [
                'table'   => $table->only(['id', 'table_number', 'capacity', 'status', 'restaurant_id']),
                'restaurant' => $table->restaurant->only(['id', 'name', 'slug']),
                'session' => $activeSession ? $activeSession->load('participants.user') : null,
                'action'  => $activeSession ? 'join_existing_session' : 'start_new_session',
            ],
        ]);
    }

    /**
     * Start a new session or join an existing one via QR scan in a single call.
     * Handles guests (device_id) and authenticated users.
     * Called from the /scan/{token} frontend page.
     */
    public function scanAndJoin(Request $request, string $qrCode): JsonResponse
    {
        $table = Table::with(['restaurant', 'currentSession.participants.user'])
            ->where('qr_code', $qrCode)
            ->first();

        if (! $table) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid QR code',
            ], 404);
        }

        $user     = Auth::guard('sanctum')->user();
        $userId   = $user?->id;
        $deviceId = $request->header('X-Device-Id');

        $session = $table->currentSession;

        if ($session && $session->status === 'active') {
            // --- Join existing session ---
            $existing = $session->participants()
                ->where(function ($q) use ($userId, $deviceId) {
                    if ($userId) $q->where('user_id', $userId);
                    if ($deviceId) $q->orWhere('device_id', $deviceId);
                })
                ->whereNull('left_at')
                ->first();

            if (! $existing) {
                SessionParticipant::create([
                    'session_id' => $session->id,
                    'user_id'    => $userId,
                    'device_id'  => $deviceId,
                    'is_host'    => false,
                    'joined_at'  => now(),
                ]);
            }
        } else {
            // --- Start new session ---
            $session = TableSession::create([
                'table_id'      => $table->id,
                'restaurant_id' => $table->restaurant_id,
                'session_token' => Str::random(32),
                'status'        => 'active',
                'started_at'    => now(),
            ]);

            $table->update(['status' => 'occupied', 'current_session_id' => $session->id]);

            SessionParticipant::create([
                'session_id' => $session->id,
                'user_id'    => $userId,
                'device_id'  => $deviceId,
                'is_host'    => true,
                'joined_at'  => now(),
            ]);
        }

        $session->refresh()->load(['table', 'participants.user']);

        event(new \App\Events\SessionStateChanged($session->id));

        return response()->json([
            'success' => true,
            'data'    => [
                'session'    => $session,
                'table'      => $table->only(['id', 'table_number', 'capacity', 'status', 'restaurant_id']),
                'restaurant' => $table->restaurant->only(['id', 'name', 'slug']),
            ],
        ], 201);
    }
}
