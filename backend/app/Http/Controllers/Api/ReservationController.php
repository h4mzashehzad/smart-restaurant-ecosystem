<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    /**
     * Create a new reservation.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id'    => 'required|exists:restaurants,id',
            'guest_name'       => 'required|string|max:100',
            'guest_phone'      => 'required|string|max:20',
            'guest_email'      => 'nullable|email|max:150',
            'party_size'       => 'required|integer|min:1|max:20',
            'reservation_date' => 'required|date|after_or_equal:today',
            'reservation_time' => 'required|date_format:H:i',
            'special_requests' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Find a suitable table
        $table = Table::where('restaurant_id', $request->restaurant_id)
            ->where('capacity', '>=', $request->party_size)
            ->where('status', 'available')
            ->orderBy('capacity')
            ->first();

        $reservation = Reservation::create([
            'restaurant_id'    => $request->restaurant_id,
            'user_id'          => $request->user()?->id,
            'guest_name'       => $request->guest_name,
            'guest_phone'      => $request->guest_phone,
            'guest_email'      => $request->guest_email,
            'party_size'       => $request->party_size,
            'reservation_date' => $request->reservation_date,
            'reservation_time' => $request->reservation_time,
            'table_id'         => $table?->id,
            'status'           => 'pending',
            'special_requests' => $request->special_requests,
            'confirmation_code' => strtoupper(Str::random(8)),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reservation created',
            'data'    => $reservation,
        ], 201);
    }

    /**
     * Get reservation by confirmation code.
     */
    public function show(string $confirmationCode): JsonResponse
    {
        $reservation = Reservation::with(['restaurant', 'table'])
            ->where('confirmation_code', $confirmationCode)
            ->first();

        if (! $reservation) {
            return response()->json([
                'success' => false,
                'message' => 'Reservation not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $reservation,
        ]);
    }

    /**
     * Cancel a reservation.
     */
    public function cancel(Reservation $reservation): JsonResponse
    {
        if ($reservation->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Reservation is already cancelled',
            ], 409);
        }

        $reservation->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reservation cancelled',
        ]);
    }

    /**
     * Check table availability for a restaurant on a given date.
     */
    public function availability(Request $request, Restaurant $restaurant): JsonResponse
    {
        $date = $request->input('date', now()->format('Y-m-d'));
        $partySize = $request->input('party_size', 2);

        $totalTables = $restaurant->tables()
            ->where('capacity', '>=', $partySize)
            ->count();

        $reservedTables = Reservation::where('restaurant_id', $restaurant->id)
            ->where('reservation_date', $date)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->count();

        $availableSlots = max($totalTables - $reservedTables, 0);

        return response()->json([
            'success' => true,
            'data'    => [
                'date'            => $date,
                'party_size'      => $partySize,
                'total_tables'    => $totalTables,
                'reserved'        => $reservedTables,
                'available_slots' => $availableSlots,
            ],
        ]);
    }
}
