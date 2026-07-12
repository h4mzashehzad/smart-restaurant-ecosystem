<?php

namespace App\Http\Controllers\Api;

use App\Events\ReservationUpdated;
use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ReservationController extends Controller
{
    use ResolvesRestaurant;

    /**
     * Get restaurant info by slug (public — powers the reservation page).
     */
    public function restaurantBySlug(string $slug): JsonResponse
    {
        $restaurant = Restaurant::where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (! $restaurant) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant not found',
            ], 404);
        }

        $tables = $restaurant->tables()
            ->select('id', 'table_number', 'capacity', 'status')
            ->orderBy('table_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'address' => $restaurant->address,
                'phone' => $restaurant->phone,
                'opening_time' => $restaurant->opening_time,
                'closing_time' => $restaurant->closing_time,
                'tables' => $tables,
            ],
        ]);
    }

    /**
     * Get available 30-minute time slots for a restaurant on a given date.
     */
    public function timeSlots(Request $request, Restaurant $restaurant): JsonResponse
    {
        $date = $request->input('date', now()->format('Y-m-d'));

        $opening = Carbon::parse($restaurant->opening_time);
        $closing = Carbon::parse($restaurant->closing_time);

        $slots = [];
        $current = $opening->copy();

        while ($current->lt($closing)) {
            $timeStr = $current->format('H:i');

            // If date is today, skip past slots
            $isPast = ($date === now()->format('Y-m-d'))
                && Carbon::parse($date.' '.$timeStr)->lt(now());

            $slots[] = [
                'time' => $timeStr,
                'label' => $current->format('g:i A'),
                'disabled' => $isPast,
            ];

            $current->addMinutes(30);
        }

        return response()->json([
            'success' => true,
            'data' => $slots,
        ]);
    }

    /**
     * Check per-table availability for a restaurant on a given date + time.
     */
    public function availability(Request $request, Restaurant $restaurant): JsonResponse
    {
        $date = $request->input('date', now()->format('Y-m-d'));
        $time = $request->input('time', now()->format('H:i'));
        $partySize = (int) $request->input('party_size', 1);

        $requestedTime = Carbon::parse($date.' '.$time);

        // Get all tables for this restaurant
        $tables = $restaurant->tables()
            ->select('id', 'table_number', 'capacity', 'status')
            ->orderBy('table_number')
            ->get();

        // Get reservations for this date that overlap with the requested time window (±1 hour)
        $windowStart = $requestedTime->copy()->subHour()->format('H:i:s');
        $windowEnd = $requestedTime->copy()->addHour()->format('H:i:s');

        $reservedTableIds = Reservation::where('restaurant_id', $restaurant->id)
            ->forDate($date)
            ->active()
            ->whereNotNull('table_id')
            ->whereBetween('reservation_time', [$windowStart, $windowEnd])
            ->pluck('table_id')
            ->toArray();

        $result = $tables->map(function ($table) use ($reservedTableIds, $partySize) {
            $isReserved = in_array($table->id, $reservedTableIds);
            $tooSmall = $table->capacity < $partySize;

            return [
                'id' => $table->id,
                'table_number' => $table->table_number,
                'capacity' => $table->capacity,
                'is_available' => ! $isReserved && ! $tooSmall,
                'reason' => $isReserved ? 'reserved' : ($tooSmall ? 'too_small' : null),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Create a new reservation (public — guests can book without auth).
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'restaurant_id' => 'required|exists:restaurants,id',
            'table_id' => 'required|exists:tables,id',
            'guest_name' => 'required|string|max:100',
            'guest_phone' => 'required|string|max:20',
            'guest_email' => 'nullable|email|max:150',
            'party_size' => 'required|integer|min:1|max:20',
            'reservation_date' => 'required|date|after_or_equal:today|before_or_equal:'.now()->addDays(30)->format('Y-m-d'),
            'reservation_time' => 'required|date_format:H:i',
            'special_requests' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Verify the table belongs to the restaurant
        $table = Table::where('id', $request->table_id)
            ->where('restaurant_id', $request->restaurant_id)
            ->first();

        if (! $table) {
            return response()->json([
                'success' => false,
                'message' => 'Table not found for this restaurant',
            ], 422);
        }

        // Check the table is not already reserved for this time window
        $requestedTime = Carbon::parse($request->reservation_date.' '.$request->reservation_time);
        $windowStart = $requestedTime->copy()->subHour()->format('H:i:s');
        $windowEnd = $requestedTime->copy()->addHour()->format('H:i:s');

        $conflict = Reservation::where('restaurant_id', $request->restaurant_id)
            ->where('table_id', $request->table_id)
            ->forDate($request->reservation_date)
            ->active()
            ->whereBetween('reservation_time', [$windowStart, $windowEnd])
            ->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'This table is already reserved for the selected time.',
            ], 409);
        }

        $reservation = Reservation::create([
            'restaurant_id' => $request->restaurant_id,
            'user_id' => $request->user()?->id,
            'guest_name' => $request->guest_name,
            'guest_phone' => $request->guest_phone,
            'guest_email' => $request->guest_email,
            'party_size' => $request->party_size,
            'reservation_date' => $request->reservation_date,
            'reservation_time' => $request->reservation_time,
            'table_id' => $request->table_id,
            'status' => 'pending',
            'special_requests' => $request->special_requests,
            'confirmation_code' => strtoupper(Str::random(8)),
        ]);

        $reservation->load(['table', 'restaurant']);

        event(new ReservationUpdated($reservation, 'created'));

        if ($request->guest_email) {
            \Illuminate\Support\Facades\Mail::to($request->guest_email)
                ->send(new \App\Mail\ReservationConfirmed($reservation));
        }

        return response()->json([
            'success' => true,
            'message' => 'Reservation created',
            'data' => $reservation,
        ], 201);
    }

    /**
     * Get reservation by confirmation code (public).
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
            'data' => $reservation,
        ]);
    }

    /**
     * Cancel a reservation (public — by reservation ID).
     */
    public function cancel(Reservation $reservation): JsonResponse
    {
        if (in_array($reservation->status, ['cancelled', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Reservation cannot be cancelled in its current state',
            ], 409);
        }

        $reservation->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        $reservation->load('table');

        event(new ReservationUpdated($reservation, 'cancelled'));

        return response()->json([
            'success' => true,
            'message' => 'Reservation cancelled',
        ]);
    }

    /**
     * List reservations for the authenticated staff member's own restaurant (KDS).
     * Never trusts a client-supplied restaurant id.
     */
    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $date = $request->input('date', now()->format('Y-m-d'));

        $reservations = Reservation::with(['table', 'user'])
            ->where('restaurant_id', $restaurantId)
            ->forDate($date)
            ->orderBy('reservation_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $reservations,
        ]);
    }

    /**
     * Update reservation status (staff — KDS).
     */
    public function updateStatus(Request $request, Reservation $reservation): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:confirmed,seated,completed,cancelled,no_show',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $newStatus = $request->status;

        // Validate status transitions
        $allowed = match ($reservation->status) {
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['seated', 'cancelled', 'no_show'],
            'seated' => ['completed', 'no_show'],
            default => [],
        };

        if (! in_array($newStatus, $allowed)) {
            return response()->json([
                'success' => false,
                'message' => "Cannot transition from '{$reservation->status}' to '{$newStatus}'",
            ], 409);
        }

        $updates = ['status' => $newStatus];
        if ($newStatus === 'confirmed') {
            $updates['confirmed_at'] = now();
        }
        if ($newStatus === 'cancelled') {
            $updates['cancelled_at'] = now();
        }

        $reservation->update($updates);
        $reservation->load('table');

        event(new ReservationUpdated($reservation, 'status_changed'));

        return response()->json([
            'success' => true,
            'message' => "Reservation status updated to {$newStatus}",
            'data' => $reservation,
        ]);
    }

    /**
     * Webhook for socket server to update reservation status.
     */
    public function webhookUpdateStatus(Request $request): JsonResponse
    {
        $reservation = Reservation::find($request->reservation_id);
        if (! $reservation) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $request->merge(['status' => $request->status]);

        return $this->updateStatus($request, $reservation);
    }
}
