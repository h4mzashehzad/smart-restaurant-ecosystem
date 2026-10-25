<?php

namespace App\Http\Controllers\Api;

use App\Events\ReservationUpdated;
use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReservationCheckoutRequest;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use App\Services\ReservationPreorderService;
use App\Services\ReservationRefundService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                'timezone' => $restaurant->timezone,
                'email' => $restaurant->email,
                'tables' => $tables,
            ],
        ]);
    }

    /**
     * Get available 30-minute time slots for a restaurant on a given date.
     */
    public function timeSlots(Request $request, Restaurant $restaurant): JsonResponse
    {
        if (! $restaurant->opening_time || ! $restaurant->closing_time) {
            return response()->json(['success' => true, 'data' => []]);
        }
        $date = $request->input('date', now()->format('Y-m-d'));

        $timezone = $restaurant->timezone ?: config('reservations.default_timezone');
        $opening = Carbon::parse($restaurant->opening_time, $timezone)->format('H:i');
        $closing = Carbon::parse($restaurant->closing_time, $timezone)->format('H:i');
        $slots = [];
        $current = Carbon::parse($date.' 00:00', $timezone);
        $end = $current->copy()->addDay();
        while ($current->lt($end)) {
            $timeStr = $current->format('H:i');
            $withinHours = $closing > $opening ? $timeStr >= $opening && $timeStr < $closing : $timeStr >= $opening || $timeStr < $closing;
            if ($withinHours) {
                $slots[] = ['time' => $timeStr, 'label' => $current->format('g:i A'), 'disabled' => $current->lt(now())];
            }
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

        $requestedTime = app(ReservationPreorderService::class)->arrival($restaurant, $date, $time);
        $tables = $restaurant->tables()->select('id', 'table_number', 'capacity', 'status')->orderBy('table_number')->get();
        $reservedTableIds = Reservation::query()->where('restaurant_id', $restaurant->id)->active()
            ->whereBetween('arrival_at', [$requestedTime->subHour(), $requestedTime->addHour()])->pluck('table_id')->all();

        $result = $tables->map(function ($table) use ($reservedTableIds, $partySize) {
            $isReserved = in_array($table->id, $reservedTableIds);
            $tooSmall = $table->capacity < $partySize;

            return [
                'id' => $table->id,
                'table_number' => $table->table_number,
                'capacity' => $table->capacity,
                'is_available' => ! $isReserved && ! $tooSmall && $table->status !== 'maintenance',
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
    public function store(ReservationCheckoutRequest $request, ReservationPreorderService $service): JsonResponse
    {
        abort_if($request->filled('items'), 422, 'Use reservation checkout to pay for a preorder.');
        $reservation = $service->create($request->validated(), $request->user('sanctum')?->id);

        return response()->json(['success' => true, 'message' => 'Reservation requested', 'data' => $reservation->load('table', 'restaurant'), 'management_url' => $reservation->managementUrl()], 201);
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
    public function cancel(Request $request, Reservation $reservation, ReservationRefundService $refunds): JsonResponse
    {
        abort_unless(hash_equals($reservation->managementToken(), (string) $request->input('token', '')), 403, 'Use your secure reservation email link to cancel.');
        $refunds->cancel($reservation);

        return response()->json(['success' => true, 'message' => 'Reservation cancelled']);
    }

    /**
     * List reservations for the authenticated staff member's own restaurant (KDS).
     * Never trusts a client-supplied restaurant id.
     */
    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);
        $date = $request->input('date', now(Restaurant::findOrFail($restaurantId)->timezone ?: config('reservations.default_timezone'))->format('Y-m-d'));

        $reservations = Reservation::with(['restaurant', 'table', 'user', 'preorder.reservation', 'preorder.items.menuItem', 'preorder.items.customizations', 'preorder.payments.refunds', 'refunds'])
            ->where('restaurant_id', $restaurantId)
            ->forDate($date)
            ->orderBy('reservation_time')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $reservations->map(fn (Reservation $r) => app(ReservationPreorderService::class)->view($r)),
        ]);
    }

    /**
     * Update reservation status (staff — KDS).
     */
    public function updateStatus(Request $request, Reservation $reservation): JsonResponse
    {
        abort_unless($reservation->restaurant_id === $this->restaurantId($request), 404);

        return DB::transaction(function () use ($request, $reservation): JsonResponse {
            Table::query()->lockForUpdate()->findOrFail($reservation->table_id);
            $locked = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);

            return $this->applyStatus($request, $locked);
        }, 3);
    }

    private function applyStatus(Request $request, Reservation $reservation): JsonResponse
    {
        abort_unless($reservation->restaurant_id === $this->restaurantId($request), 404);
        abort_if(in_array($reservation->checkout_state, ['pending', 'expired', 'failed'], true), 409, 'This preorder has not been paid.');
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
        if ($newStatus === 'cancelled') {
            $request->validate(['cancellation_actor' => 'required|in:customer,restaurant', 'reason' => 'nullable|string|max:500']);
            $reservation = app(ReservationRefundService::class)->cancel($reservation, $request->cancellation_actor, $request->reason);

            return response()->json(['success' => true, 'data' => app(ReservationPreorderService::class)->view($reservation)]);
        }
        if ($newStatus === 'seated' && $reservation->preorder) {
            return $this->seatPreorder($request, $reservation);
        }

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
        if ($newStatus === 'confirmed' && ! $reservation->preorder) {
            $reservation->update(['confirmation_sent_at' => null]);
            \App\Jobs\SendReservationMail::dispatch($reservation->id);
        }

        event(new ReservationUpdated($reservation, 'status_changed'));

        return response()->json([
            'success' => true,
            'message' => "Reservation status updated to {$newStatus}",
            'data' => $reservation,
        ]);
    }

    private function seatPreorder(Request $request, Reservation $reservation): JsonResponse
    {
        $request->validate(['session_id' => 'nullable|integer|exists:table_sessions,id', 'confirm_new_session' => 'sometimes|accepted']);
        abort_unless($reservation->status === 'confirmed', 409, 'Only confirmed reservations can be seated.');
        $session = DB::transaction(function () use ($request, $reservation) {
            $table = Table::query()->lockForUpdate()->findOrFail($reservation->table_id);
            $booking = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);
            abort_unless($booking->status === 'confirmed', 409, 'Reservation is already seated or cancelled.');
            $order = $booking->preorder()->lockForUpdate()->firstOrFail();
            if ($request->filled('session_id')) {
                $session = \App\Models\TableSession::query()->where('table_id', $table->id)->where('restaurant_id', $booking->restaurant_id)->whereIn('status', ['active', 'checkout_pending'])->findOrFail($request->session_id);
            } else {
                abort_unless($request->boolean('confirm_new_session'), 422, 'Confirm a new table session or choose this party’s existing session.');
                abort_if($table->currentSession && in_array($table->currentSession->status, ['active', 'checkout_pending'], true), 409, 'This table already has a session. Link the reservation to this party’s session explicitly.');
                $session = \App\Models\TableSession::create(['table_id' => $table->id, 'restaurant_id' => $booking->restaurant_id, 'session_token' => Str::random(32), 'status' => 'active', 'payment_status' => 'paid', 'started_at' => now(), 'total_amount' => 0]);
                $table->update(['status' => 'occupied', 'current_session_id' => $session->id]);
            }
            $order->update(['session_id' => $session->id]);
            $order->payments()->update(['session_id' => $session->id]);
            app(ReservationPreorderService::class)->syncDiningSession($order);
            $booking->update(['status' => 'seated']);
            DB::afterCommit(fn () => event(new ReservationUpdated($booking->fresh(), 'status_changed')));

            return $session;
        }, 3);

        return response()->json(['success' => true, 'data' => app(ReservationPreorderService::class)->view($reservation->fresh()), 'session_id' => $session->id]);
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
