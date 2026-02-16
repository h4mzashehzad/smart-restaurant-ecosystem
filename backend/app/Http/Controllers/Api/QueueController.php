<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QueueEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QueueController extends Controller
{
    /**
     * Join the walk-in queue.
     */
    public function join(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id' => 'required|exists:restaurants,id',
            'guest_name'    => 'required|string|max:100',
            'guest_phone'   => 'required|string|max:20',
            'party_size'    => 'required|integer|min:1|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Determine next queue number
        $lastNumber = QueueEntry::where('restaurant_id', $request->restaurant_id)
            ->whereDate('joined_at', today())
            ->max('queue_number') ?? 0;

        // Estimate wait time based on current queue size
        $waitingCount = QueueEntry::where('restaurant_id', $request->restaurant_id)
            ->where('status', 'waiting')
            ->count();

        $entry = QueueEntry::create([
            'restaurant_id'      => $request->restaurant_id,
            'user_id'            => $request->user()?->id,
            'guest_name'         => $request->guest_name,
            'guest_phone'        => $request->guest_phone,
            'party_size'         => $request->party_size,
            'queue_number'       => $lastNumber + 1,
            'estimated_wait_time' => ($waitingCount + 1) * 15, // ~15 min per party
            'status'             => 'waiting',
            'joined_at'          => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Added to queue',
            'data'    => $entry,
        ], 201);
    }

    /**
     * Get current queue status for the authenticated user.
     */
    public function status(Request $request): JsonResponse
    {
        $entry = QueueEntry::where('user_id', $request->user()->id)
            ->where('status', 'waiting')
            ->latest('joined_at')
            ->first();

        if (! $entry) {
            return response()->json([
                'success' => false,
                'message' => 'You are not in any queue',
            ], 404);
        }

        $position = QueueEntry::where('restaurant_id', $entry->restaurant_id)
            ->where('status', 'waiting')
            ->where('queue_number', '<', $entry->queue_number)
            ->count() + 1;

        return response()->json([
            'success' => true,
            'data'    => [
                'entry'               => $entry,
                'position'            => $position,
                'estimated_wait_time' => $position * 15,
            ],
        ]);
    }
}
