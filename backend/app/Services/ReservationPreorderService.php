<?php

namespace App\Services;

use App\Events\OrderCreated;
use App\Events\ReservationUpdated;
use App\Jobs\SendReservationMail;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ReservationPreorderService
{
    public function __construct(
        private IngredientCustomizationPricer $pricer,
        private SafepayService $safepay,
        private LoyaltyService $loyalty,
    ) {}

    public function arrival(Restaurant $restaurant, string $date, string $time): CarbonImmutable
    {
        return CarbonImmutable::parse($date.' '.$time, $restaurant->timezone ?: config('reservations.default_timezone'))->utc();
    }

    public function assertAvailable(Table $table, CarbonImmutable $arrival, ?int $except = null): void
    {
        $conflict = Reservation::query()->where('table_id', $table->id)->active()
            ->when($except, fn ($q) => $q->whereKeyNot($except))
            ->whereBetween('arrival_at', [$arrival->subHour(), $arrival->addHour()])->exists();
        abort_if($conflict, 409, 'This table is already reserved for the selected time.');
    }

    public function create(array $data, ?int $userId = null): Reservation
    {
        return DB::transaction(function () use ($data, $userId): Reservation {
            $table = Table::query()->where('restaurant_id', $data['restaurant_id'])->lockForUpdate()->findOrFail($data['table_id']);
            $restaurant = Restaurant::query()->where('is_active', true)->findOrFail($data['restaurant_id']);
            if (! empty($data['checkout_key'])) {
                $existing = Reservation::query()->where('checkout_key', $data['checkout_key'])->first();
                if ($existing) {
                    abort_unless($existing->table_id === $table->id && $existing->guest_email === $data['guest_email'], 409, 'Checkout details have changed. Start a new reservation.');

                    return $existing;
                }
            }
            $arrival = $this->arrival($restaurant, $data['reservation_date'], $data['reservation_time']);
            $local = $arrival->setTimezone($restaurant->timezone ?: config('reservations.default_timezone'));
            if ($arrival->lte(now()) || $local->startOfDay()->gt(now($local->timezone)->addDays(30)->startOfDay())) {
                throw ValidationException::withMessages(['reservation_time' => 'Choose a future reservation within the next 30 days.']);
            }
            $opening = CarbonImmutable::parse($local->toDateString().' '.$restaurant->opening_time, $local->timezone);
            $closing = CarbonImmutable::parse($local->toDateString().' '.$restaurant->closing_time, $local->timezone);
            if ($closing->lte($opening)) {
                if ($local->lt($opening)) {
                    $opening = $opening->subDay();
                } else {
                    $closing = $closing->addDay();
                }
            }
            if ($local->lt($opening) || $local->gte($closing) || $local->minute % 30 !== 0 || $table->capacity < $data['party_size'] || $table->status === 'maintenance') {
                throw ValidationException::withMessages(['table_id' => 'Choose an available table of sufficient capacity and a time within restaurant opening hours.']);
            }
            $this->assertAvailable($table, $arrival);
            $hasPreorder = ! empty($data['items']);
            $pricedItems = [];
            $subtotal = 0;
            $longest = 0;
            foreach ($data['items'] ?? [] as $line) {
                $item = MenuItem::query()->where('restaurant_id', $restaurant->id)->where('is_available', true)
                    ->whereHas('category', fn ($q) => $q->where('is_active', true))->with('ingredients')->find($line['menu_item_id']);
                if (! $item) {
                    throw ValidationException::withMessages(['items' => 'One of the selected dishes is no longer available at this restaurant.']);
                }
                $priced = $this->pricer->price($item, $line['customizations'] ?? []);
                $unitPaisa = (int) round(((float) $item->base_price + $priced['unit_price_adjustment']) * 100);
                $subtotal += $unitPaisa * $line['quantity'];
                $prep = max(1, (int) ($item->preparation_time ?: 15));
                $longest = max($longest, $prep);
                $snapshot = collect($priced['normalized_rows'])->map(fn ($c) => [...$c, 'name' => $item->ingredients->firstWhere('id', $c['ingredient_id'])?->name])->all();
                $pricedItems[] = ['menu_item_id' => $item->id, 'item_name' => $item->name, 'quantity' => $line['quantity'], 'unit_price' => $unitPaisa / 100, 'total_price' => $unitPaisa * $line['quantity'] / 100,
                    'preparation_minutes' => $prep, 'customization_snapshot' => $snapshot,
                    'customization_notes' => collect($snapshot)->map(fn ($c) => $c['name'].': '.$c['action'].' '.$c['quantity'])->implode(', ')];
            }
            $discount = $userId ? $this->loyalty->discountFor(\App\Models\User::findOrFail($userId), $subtotal / 100)['amount'] : 0;
            $discountPaisa = (int) round($discount * 100);
            $taxPaisa = (int) round(($subtotal - $discountPaisa) * 0.12);
            $totalPaisa = $subtotal - $discountPaisa + $taxPaisa;
            if ($hasPreorder && abs($totalPaisa - (int) round($data['expected_total'] * 100)) > 1) {
                throw ValidationException::withMessages(['expected_total' => 'Menu pricing has changed. Review your cart and try again.']);
            }
            if ($hasPreorder && $arrival->lt(now()->addMinutes($longest + config('reservations.preparation_buffer_minutes')))) {
                throw ValidationException::withMessages(['items' => 'There is not enough preparation time for this preorder. Choose a later time or reserve the table only.']);
            }
            $reservation = Reservation::create(collect($data)->only(['restaurant_id', 'table_id', 'guest_name', 'guest_phone', 'guest_email', 'party_size', 'reservation_date', 'reservation_time', 'special_requests', 'checkout_key'])->all() + [
                'user_id' => $userId, 'arrival_at' => $arrival, 'cancellation_deadline' => $arrival->subHours(config('reservations.cancellation_hours')),
                'status' => 'pending', 'checkout_state' => $hasPreorder ? 'pending' : 'table_only',
                'checkout_expires_at' => $hasPreorder ? now()->addMinutes(config('reservations.hold_minutes')) : null,
                'cancellation_fee_percent' => config('reservations.cancellation_fee_percent'), 'confirmation_code' => strtoupper(Str::random(12)),
            ]);
            if ($hasPreorder) {
                $order = $reservation->preorder()->create([
                    'restaurant_id' => $restaurant->id, 'table_id' => $table->id, 'user_id' => $userId,
                    'order_type' => 'reservation_preorder', 'order_number' => 'PRE-'.strtoupper(Str::random(12)),
                    'subtotal' => $subtotal / 100, 'discount_amount' => $discountPaisa / 100, 'tax_amount' => $taxPaisa / 100, 'total_amount' => $totalPaisa / 100,
                    'status' => 'pending_payment', 'special_instructions' => $data['special_instructions'] ?? null, 'placed_at' => now(),
                    'kitchen_release_at' => $arrival->subMinutes(max(config('reservations.minimum_kitchen_lead_minutes'), $longest + config('reservations.preparation_buffer_minutes'))),
                ]);
                foreach ($pricedItems as $item) {
                    $orderItem = $order->items()->create($item);
                    foreach ($item['customization_snapshot'] as $customization) {
                        $orderItem->customizations()->create(collect($customization)->except('name')->all());
                    }
                }
                $order->payments()->create(['user_id' => $userId, 'payment_method' => 'safepay', 'payment_type' => 'full', 'amount' => $totalPaisa / 100,
                    'transaction_id' => 'PRE-'.Str::uuid(), 'status' => 'pending', 'expires_at' => $reservation->checkout_expires_at]);
            } else {
                DB::afterCommit(fn () => SendReservationMail::dispatch($reservation->id));
            }
            DB::afterCommit(fn () => event(new ReservationUpdated($reservation, 'created')));

            return $reservation;
        }, 3);
    }

    public function startPayment(Reservation $reservation): array
    {
        return DB::transaction(function () use ($reservation): array {
            $reservation = Reservation::query()->lockForUpdate()->findOrFail($reservation->id);
            abort_unless($reservation->checkout_state === 'pending' && $reservation->checkout_expires_at?->isFuture() && $reservation->status === 'pending', 409, 'This checkout has expired or is already complete.');
            $payment = $reservation->preorder->payments()->lockForUpdate()->firstOrFail();
            if ($payment->safepay_tracker_token && data_get($payment->gateway_response, 'checkout_url')) {
                return ['checkout_url' => $payment->gateway_response['checkout_url']];
            }
            $tracker = $this->safepay->createTracker((float) $payment->amount, ['order_id' => (string) $payment->order_id], 'CYBERSOURCE');
            $passport = $this->safepay->createPassportToken();
            $url = $reservation->managementUrl();
            $checkout = $this->safepay->generateCheckoutUrl($tracker['tracker_token'], $passport, $url.'&payment_return=1', $url.'&payment_cancelled=1');
            $payment->update(['safepay_tracker_token' => $tracker['tracker_token'], 'status' => 'processing', 'gateway_response' => ['checkout_url' => $checkout]]);

            return ['checkout_url' => $checkout];
        });
    }

    public function complete(Payment $payment, array $gatewayResponse): Payment
    {
        $booking = $payment->order->reservation;
        DB::transaction(function () use ($booking, $payment, $gatewayResponse): void {
            $table = Table::query()->lockForUpdate()->find($booking->table_id);
            $reservation = Reservation::query()->lockForUpdate()->findOrFail($booking->id);
            $order = $reservation->preorder()->lockForUpdate()->firstOrFail();
            $payment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
            if ($payment->paid_at) {
                return;
            }
            $payment->update(['status' => 'completed', 'paid_at' => now(), 'gateway_response' => array_merge($payment->gateway_response ?? [], $gatewayResponse)]);
            $canConfirm = $table && ! in_array($reservation->status, ['cancelled', 'completed', 'no_show'], true) && $reservation->arrival_at->isFuture();
            if ($canConfirm) {
                $canConfirm = ! Reservation::query()->where('table_id', $table->id)->whereKeyNot($reservation->id)->active()
                    ->whereBetween('arrival_at', [$reservation->arrival_at->subHour(), $reservation->arrival_at->addHour()])->exists();
            }
            if (! $canConfirm) {
                $reservation->update(['checkout_state' => 'paid']);
                DB::afterCommit(fn () => app(ReservationRefundService::class)->cancel($reservation, 'restaurant', 'Payment completed after the table became unavailable.'));

                return;
            }
            $reservation->update(['status' => 'confirmed', 'confirmed_at' => now(), 'checkout_state' => 'paid', 'checkout_expires_at' => null]);
            $order->update(['status' => 'scheduled']);
            $this->loyalty->awardPoints($order);
            DB::afterCommit(function () use ($reservation): void {
                SendReservationMail::dispatch($reservation->id);
                event(new ReservationUpdated($reservation->fresh(), 'status_changed'));
            });
        }, 3);
        $this->releaseDue();

        return $payment->fresh();
    }

    public function advance(Order $order, string $status, ?\App\Models\User $staff): Order
    {
        abort_unless($staff && $staff->is_active !== false && in_array($staff->role, ['admin', 'staff'], true) && $staff->restaurant_id === $order->restaurant_id, 403);

        return DB::transaction(function () use ($order, $status): Order {
            Table::query()->lockForUpdate()->findOrFail($order->table_id);
            $reservation = Reservation::query()->lockForUpdate()->findOrFail($order->reservation_id);
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
            $next = ['confirmed' => 'preparing', 'preparing' => 'ready', 'ready' => 'served', 'served' => 'completed'];
            abort_unless(in_array($reservation->status, ['confirmed', 'seated'], true) && ($next[$locked->status] ?? null) === $status, 409, 'Only released, active preorders can progress. Use reservation controls for cancellations.');
            $updates = ['status' => $status];
            if ($status === 'ready') {
                $updates['ready_at'] = now();
            }
            if ($status === 'completed') {
                $updates['completed_at'] = now();
            }
            $locked->update($updates);
            broadcast(new \App\Events\OrderStatusUpdated($locked->id, $status, $locked->restaurant_id, $locked->session_id ? $locked->table_id : null));

            return $locked->fresh();
        }, 3);
    }

    public function syncDiningSession(Order $order): void
    {
        if (! $order->session_id) {
            return;
        }
        $session = \App\Models\TableSession::query()->lockForUpdate()->findOrFail($order->session_id);
        $total = (float) $session->orders()->where('status', '!=', 'cancelled')->sum('total_amount');
        $paid = (float) $session->payments()->where('status', 'completed')->whereHas('order', fn ($q) => $q->where('status', '!=', 'cancelled'))->sum('amount');
        $session->update(['total_amount' => $total, 'payment_status' => $paid <= 0 ? 'unpaid' : ($paid >= $total ? 'paid' : 'partial')]);
    }

    public function releaseDue(): int
    {
        $released = 0;
        $ids = Order::query()->whereNotNull('reservation_id')->where('status', 'scheduled')->where('kitchen_release_at', '<=', now())->pluck('id');
        foreach ($ids as $id) {
            $order = Order::find($id);
            $changed = DB::transaction(function () use ($order): bool {
                Table::query()->lockForUpdate()->findOrFail($order->table_id);
                $reservation = Reservation::query()->lockForUpdate()->findOrFail($order->reservation_id);
                $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
                if ($locked->status !== 'scheduled' || ! in_array($reservation->status, ['confirmed', 'seated'], true) || $reservation->checkout_state !== 'paid' || $reservation->refunds()->exists()) {
                    return false;
                }
                $locked->update(['status' => 'confirmed', 'confirmed_at' => now(), 'kitchen_released_at' => now()]);

                return true;
            }, 3);
            $released += (int) $changed;
        }
        Order::query()->whereNotNull('reservation_id')->whereNotNull('kitchen_released_at')->whereNull('kitchen_notified_at')
            ->whereIn('status', ['confirmed', 'preparing', 'ready'])->each(function (Order $order): void {
                try {
                    DB::transaction(function () use ($order): void {
                        Table::query()->lockForUpdate()->findOrFail($order->table_id);
                        $reservation = Reservation::query()->lockForUpdate()->findOrFail($order->reservation_id);
                        $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
                        if ($locked->kitchen_notified_at || ! in_array($locked->status, ['confirmed', 'preparing', 'ready'], true)
                            || ! in_array($reservation->status, ['confirmed', 'seated'], true)) {
                            return;
                        }
                        broadcast(new OrderCreated($locked));
                        $locked->update(['kitchen_notified_at' => now()]);
                    }, 3);
                } catch (\Throwable $e) {
                    report($e);
                }
            });

        return $released;
    }

    public function view(Reservation $reservation, bool $privateLinks = false): array
    {
        $reservation->loadMissing(['restaurant', 'table', 'preorder.reservation', 'preorder.items.menuItem', 'preorder.items.customizations', 'preorder.payments.refunds', 'refunds']);
        $data = $reservation->toArray();
        if ($reservation->preorder) {
            $data['preorder']['payments'] = $reservation->preorder->payments->map(fn (Payment $p) => $p->only(['id', 'payment_method', 'amount', 'status', 'paid_at', 'receipt_url']) + ['refunds' => $p->refunds->toArray()])->all();
        }
        if ($privateLinks && $reservation->preorder) {
            foreach ($data['preorder']['payments'] as &$row) {
                if ($row['receipt_url']) {
                    $row['receipt_url'] = '/api/reservation-management/'.$reservation->confirmation_code.'/receipt?token='.$reservation->managementToken();
                }
            }
            unset($row);
        }
        $payment = $reservation->preorder?->payments->first();
        $paidPaisa = $payment?->paid_at ? (int) round((float) $payment->amount * 100) : 0;
        $fee = (int) round($paidPaisa * $reservation->cancellation_fee_percent / 100);
        $data['cancellation'] = [
            'allowed' => in_array($reservation->status, ['pending', 'confirmed'], true) && (! $paidPaisa || ($reservation->cancellation_deadline && now()->lte($reservation->cancellation_deadline))),
            'deadline' => $reservation->cancellation_deadline?->toISOString(), 'fee_paisa' => $fee, 'refund_paisa' => $paidPaisa - $fee,
        ];

        return $data;
    }
}
