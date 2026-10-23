<?php

use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Events\ReservationUpdated;
use App\Jobs\SendReservationMail;
use App\Mail\ReservationConfirmed;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\PaymentRefund;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\User;
use App\Services\PaymentCompletionService;
use App\Services\ReservationPreorderService;
use App\Services\ReservationRefundService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->travelTo(\Carbon\Carbon::parse('2026-10-23 06:00:00', 'UTC'));
    Event::fake([OrderCreated::class, OrderStatusUpdated::class, ReservationUpdated::class]);
    Queue::fake([SendReservationMail::class]);
    Mail::fake();
    config(['safepay.base_url' => 'https://sandbox.api.getsafepay.com', 'safepay.api_key' => 'test', 'safepay.secret_key' => 'test', 'app.frontend_url' => 'https://restaurant.test']);
    Http::preventStrayRequests();
    Http::fake([
        '*/order/payments/v3/*/refund' => Http::response(['data' => ['tracker' => ['state' => 'TRACKER_PARTIAL_REFUND']]]),
        '*/order/payments/v3/' => Http::response(['data' => ['tracker' => ['token' => 'track_reservation']]]),
        '*/client/passport/v1/token' => Http::response(['data' => 'passport_test']),
        '*/reporter/api/v1/payments/*' => Http::response(['data' => ['state' => 'TRACKER_ENDED']]),
    ]);
    $this->restaurant = Restaurant::create(['name' => 'Preorder Cafe', 'slug' => 'preorder-cafe', 'opening_time' => '10:00', 'closing_time' => '23:00', 'timezone' => 'Asia/Karachi', 'phone' => '03001234567', 'is_active' => true]);
    $this->table = Table::create(['restaurant_id' => $this->restaurant->id, 'table_number' => 'P1', 'qr_code' => 'preorder-table', 'capacity' => 4, 'status' => 'available']);
    $category = Category::create(['restaurant_id' => $this->restaurant->id, 'name' => 'Mains', 'slug' => 'mains', 'is_active' => true]);
    $this->dish = MenuItem::create(['restaurant_id' => $this->restaurant->id, 'category_id' => $category->id, 'name' => 'Karahi', 'slug' => 'karahi', 'base_price' => 1000, 'is_available' => true, 'preparation_time' => 45]);
    $this->payload = ['restaurant_id' => $this->restaurant->id, 'table_id' => $this->table->id, 'guest_name' => 'Aisha', 'guest_phone' => '03001112222', 'guest_email' => 'aisha@example.com', 'party_size' => 2,
        'reservation_date' => '2026-10-24', 'reservation_time' => '19:00', 'checkout_key' => (string) \Illuminate\Support\Str::uuid(),
        'items' => [['menu_item_id' => $this->dish->id, 'quantity' => 2]], 'expected_total' => 2240, 'policy_accepted' => true, 'payment_method' => 'safepay'];
});

function createPreorderForTest(array $data): Reservation
{
    $service = app(ReservationPreorderService::class);
    $reservation = $service->create($data);
    $service->startPayment($reservation);

    return $reservation->fresh(['preorder.payments']);
}

function payPreorderForTest(Reservation $reservation): Reservation
{
    app(PaymentCompletionService::class)->markCompleted($reservation->preorder->payments->first(), ['test' => true]);

    return $reservation->fresh(['preorder.payments']);
}

test('preorder checkout holds a table, uses Safepay and creates no live session or immediate kitchen order', function () {
    $response = $this->postJson('/api/reservation-checkouts', $this->payload)->assertCreated();
    $code = $response->json('data.reservation.confirmation_code');
    $r = Reservation::where('confirmation_code', $code)->firstOrFail();
    expect($r->checkout_state)->toBe('pending')->and($r->arrival_at->format('Y-m-d H:i'))->toBe('2026-10-24 14:00')
        ->and($r->preorder->kitchen_release_at->format('H:i'))->toBe('13:05')
        ->and($r->preorder->items->first()->item_name)->toBe('Karahi');
    $this->assertDatabaseCount('table_sessions', 0);
    Event::assertNotDispatched(OrderCreated::class);
    $response->assertJsonMissingPath('data.reservation.preorder.payments.0.gateway_response');
    expect($response->json('data.checkout_url'))->toContain('/embedded?')->toContain('redirect_url=')->not->toContain('%2Fpayment%2Fcallback');
    $this->postJson('/api/reservation-checkouts', $this->payload)->assertCreated();
    $this->assertDatabaseCount('reservations', 1);
    $this->assertDatabaseCount('payments', 1);
});

test('verified payment auto confirms once and schedules without notifying current table diners', function () {
    $r = createPreorderForTest($this->payload);
    $r = payPreorderForTest($r);
    payPreorderForTest($r);
    expect($r->status)->toBe('confirmed')->and($r->checkout_state)->toBe('paid')->and($r->preorder->status)->toBe('scheduled')->and($r->preorder->session_id)->toBeNull();
    Queue::assertPushed(SendReservationMail::class, 1);
    Event::assertNotDispatched(OrderCreated::class);
    $this->getJson('/api/reservation-management/'.$r->confirmation_code.'?token='.$r->managementToken())->assertSuccessful()->assertJsonPath('data.preorder.status', 'scheduled');
});

test('management and cancellation require an unguessable token and opening an email link is read only', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    $path = '/api/reservation-management/'.$r->confirmation_code;
    $this->getJson($path)->assertForbidden();
    $this->postJson($path.'/cancel', ['token' => 'bad'])->assertForbidden();
    $this->postJson('/api/reservations/'.$r->id.'/cancel')->assertForbidden();
    $this->getJson($path.'?token='.$r->managementToken())->assertSuccessful();
    expect($r->fresh()->status)->toBe('confirmed');
});

test('scheduled release uses preparation snapshots and is repeatable at the exact due time', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    $due = $r->preorder->kitchen_release_at->copy();
    $this->dish->update(['preparation_time' => 5, 'name' => 'Changed dish']);
    $service = app(ReservationPreorderService::class);
    $this->travelTo($due->copy()->subSecond());
    expect($service->releaseDue())->toBe(0);
    $this->travelTo($due);
    expect($service->releaseDue())->toBe(1)->and($service->releaseDue())->toBe(0);
    Event::assertDispatched(OrderCreated::class, 1);
    $order = $r->preorder->fresh();
    expect($order->status)->toBe('confirmed')->and($order->estimated_completion_at->equalTo($r->arrival_at))->toBeTrue()
        ->and($order->items->first()->item_name)->toBe('Karahi');
});

test('customer cancellation at or before the deadline returns 95 percent once', function (int $secondsBefore) {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    $this->travelTo($r->cancellation_deadline->subSeconds($secondsBefore));
    $service = app(ReservationRefundService::class);
    $service->cancel($r);
    $service->cancel($r);
    $refund = PaymentRefund::firstOrFail();
    expect($refund->amount_paisa)->toBe(212800)->and($refund->fee_paisa)->toBe(11200);
    $service->process($refund);
    $service->process($refund);
    expect($refund->fresh()->status)->toBe('succeeded')->and($r->fresh()->status)->toBe('cancelled')->and($r->preorder->fresh()->status)->toBe('cancelled');
    Http::assertSentCount(3);
    Http::assertSent(fn ($request) => str_ends_with($request->url(), '/refund') && $request['payload']['amount'] === 212800);
    expect(app(ReservationPreorderService::class)->releaseDue())->toBe(0);
    $this->assertDatabaseCount('payment_refunds', 1);
})->with([0, 1]);

test('customer cannot cancel one second after deadline through any public entry point', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    $this->travelTo($r->cancellation_deadline->addSecond());
    $this->postJson('/api/reservation-management/'.$r->confirmation_code.'/cancel', ['token' => $r->managementToken()])->assertConflict();
    $this->postJson('/api/orders/'.$r->preorder->id.'/cancel')->assertConflict();
    $this->assertDatabaseCount('payment_refunds', 0);
});

test('restaurant cancellation refunds in full and foreign staff cannot change a reservation', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    $foreign = Restaurant::create(['name' => 'Other', 'slug' => 'other', 'is_active' => true]);
    Sanctum::actingAs(User::factory()->admin($foreign->id)->create());
    $this->patchJson('/api/admin/reservations/'.$r->id.'/status', ['status' => 'cancelled', 'cancellation_actor' => 'restaurant'])->assertNotFound();
    Sanctum::actingAs(User::factory()->admin($this->restaurant->id)->create());
    $this->travelTo($r->arrival_at->subHour());
    $this->patchJson('/api/admin/reservations/'.$r->id.'/status', ['status' => 'cancelled', 'cancellation_actor' => 'customer'])->assertConflict();
    $this->patchJson('/api/admin/reservations/'.$r->id.'/status', ['status' => 'cancelled', 'cancellation_actor' => 'restaurant'])->assertSuccessful();
    expect(PaymentRefund::first()->amount_paisa)->toBe(224000)->and(PaymentRefund::first()->fee_paisa)->toBe(0);
});

test('an uncertain Safepay refund is never blindly resubmitted or marked successful', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    app(ReservationRefundService::class)->cancel($r);
    Http::swap(new \Illuminate\Http\Client\Factory);
    Http::fake(['*' => Http::response([], 503)]);
    $refund = PaymentRefund::first();
    $service = app(ReservationRefundService::class);
    $service->process($refund);
    $service->process($refund);
    expect($refund->fresh()->status)->toBe('needs_review');
    $this->assertDatabaseCount('payment_refunds', 1);
});

test('a late payment cannot steal a table booked after the checkout hold expired', function () {
    $r = createPreorderForTest($this->payload);
    $this->travel(11)->minutes();
    $other = collect($this->payload)->except(['items', 'expected_total', 'policy_accepted', 'payment_method', 'checkout_key'])->all();
    $other['guest_name'] = 'Other customer';
    $this->postJson('/api/reservations', $other)->assertCreated();
    payPreorderForTest($r);
    expect($r->fresh()->status)->toBe('cancelled')->and(PaymentRefund::first()->fee_paisa)->toBe(0);
});

test('table only bookings stay pending and do not require card or email', function () {
    $payload = collect($this->payload)->except(['items', 'expected_total', 'policy_accepted', 'payment_method', 'checkout_key', 'guest_email'])->all();
    $this->postJson('/api/reservations', $payload)->assertCreated()->assertJsonPath('data.status', 'pending');
    $this->assertDatabaseCount('orders', 0);
    $this->assertDatabaseCount('payments', 0);
    $this->postJson('/api/reservations', $payload)->assertConflict();
});

test('preorders reject cash, missing consent, changed prices, unavailable dishes and invalid slots', function (string $case) {
    $data = $this->payload;
    match ($case) {
        'cash' => $data['payment_method'] = 'cash',
        'consent' => $data['policy_accepted'] = false,
        'price' => $data['expected_total'] = 1,
        'unavailable' => $this->dish->update(['is_available' => false]),
        'past' => [$data['reservation_date'] = '2026-10-23', $data['reservation_time'] = '10:00'],
        'closed' => $data['reservation_time'] = '08:00',
        'capacity' => $data['party_size'] = 10,
    };
    $this->postJson('/api/reservation-checkouts', $data)->assertUnprocessable();
    $this->assertDatabaseCount('orders', 0);
})->with(['cash', 'consent', 'price', 'unavailable', 'past', 'closed', 'capacity']);

test('seating requires an explicit session choice and links the paid preorder once', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    Sanctum::actingAs(User::factory()->admin($this->restaurant->id)->create());
    $path = '/api/admin/reservations/'.$r->id.'/status';
    $this->patchJson($path, ['status' => 'seated'])->assertUnprocessable();
    $this->patchJson($path, ['status' => 'seated', 'confirm_new_session' => true])->assertSuccessful();
    $this->assertDatabaseCount('table_sessions', 1);
    $session = TableSession::first();
    expect($r->preorder->fresh()->session_id)->toBe($session->id)->and((float) $session->total_amount)->toBe(2240.0);
    $this->patchJson($path, ['status' => 'seated', 'confirm_new_session' => true])->assertConflict();
    expect((float) $session->fresh()->total_amount)->toBe(2240.0);
});

test('reservation email includes food, cancellation deadline, secure link and restaurant contact', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload))->load(['restaurant', 'table', 'preorder.items', 'preorder.payments', 'refunds']);
    $html = (new ReservationConfirmed($r))->render();
    expect($html)->toContain('Karahi')->toContain('5%')->toContain('95%')->toContain('two hours')->toContain('Manage or cancel reservation')->toContain('03001234567')->toContain($r->managementToken());
});

test('quick dishes still release at least thirty minutes before arrival', function () {
    $this->dish->update(['preparation_time' => 5]);
    $r = createPreorderForTest($this->payload);
    expect($r->preorder->kitchen_release_at->equalTo($r->arrival_at->subMinutes(30)))->toBeTrue();
});

test('published menu removal preserves the purchased food snapshot', function () {
    $r = createPreorderForTest($this->payload);
    $this->dish->delete();
    $item = $r->preorder->items()->firstOrFail();
    expect($item->menu_item_id)->toBeNull()->and($item->item_name)->toBe('Karahi')->and((float) $item->unit_price)->toBe(1000.0);
});

test('availability checks overlap across midnight in restaurant local time', function () {
    $this->restaurant->update(['opening_time' => '18:00', 'closing_time' => '03:00']);
    $data = collect($this->payload)->except(['items', 'expected_total', 'policy_accepted', 'payment_method', 'checkout_key'])->all();
    $data['reservation_date'] = '2026-10-23';
    $data['reservation_time'] = '23:30';
    $this->postJson('/api/reservations', $data)->assertCreated();
    $data['reservation_date'] = '2026-10-24';
    $data['reservation_time'] = '00:00';
    $this->postJson('/api/reservations', $data)->assertConflict();
    $this->getJson('/api/restaurants/'.$this->restaurant->id.'/tables/availability?date=2026-10-24&time=00:00&party_size=2')
        ->assertSuccessful()->assertJsonPath('data.0.is_available', false);
    $this->getJson('/api/restaurants/'.$this->restaurant->id.'/time-slots?date=2026-10-24')->assertSuccessful()->assertJsonPath('data.0.time', '00:00');
});

test('KDS database hydration excludes unpaid and scheduled preorders and recovers released ones', function () {
    $r = createPreorderForTest($this->payload);
    Sanctum::actingAs(User::factory()->admin($this->restaurant->id)->create());
    $path = '/api/admin/kitchen/orders/active';
    $this->getJson($path)->assertSuccessful()->assertJsonCount(0, 'data');
    $r = payPreorderForTest($r);
    $this->getJson($path)->assertSuccessful()->assertJsonCount(0, 'data');
    $this->travelTo($r->preorder->kitchen_release_at);
    app(ReservationPreorderService::class)->releaseDue();
    $this->getJson($path)->assertSuccessful()->assertJsonCount(1, 'data')->assertJsonPath('data.0.reservation.guest_name', 'Aisha');
});

test('a valid webhook cannot confirm an unpaid preorder using its event name alone', function () {
    $r = createPreorderForTest($this->payload);
    Http::swap(new \Illuminate\Http\Client\Factory);
    Http::fake(['*' => Http::response(['data' => ['state' => 'TRACKER_STARTED']])]);
    config(['safepay.webhook_secret' => 'reservation-secret']);
    $body = json_encode(['type' => 'payment:created', 'notification' => ['tracker' => 'track_reservation', 'state' => 'PAID']]);
    $this->call('POST', '/api/payments/safepay/webhook', [], [], [], ['CONTENT_TYPE' => 'application/json', 'HTTP_X_SFPY_SIGNATURE' => hash_hmac('sha256', $body, 'reservation-secret')], $body)->assertSuccessful();
    expect($r->fresh()->checkout_state)->toBe('pending')->and($r->preorder->payments()->first()->paid_at)->toBeNull();
});

test('late success after customer cancellation returns all funds instead of reviving the booking', function () {
    $r = createPreorderForTest($this->payload);
    app(ReservationRefundService::class)->cancel($r);
    payPreorderForTest($r);
    expect($r->fresh()->status)->toBe('cancelled')->and(PaymentRefund::first()->fee_paisa)->toBe(0);
    Event::assertNotDispatched(OrderCreated::class);
});

test('a completed cancellation cannot be reversed by duplicate payment verification', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    app(ReservationRefundService::class)->cancel($r);
    app(ReservationRefundService::class)->process(PaymentRefund::first());
    payPreorderForTest($r);
    expect($r->fresh()->status)->toBe('cancelled')->and($r->preorder->fresh()->status)->toBe('cancelled')->and(PaymentRefund::first()->status)->toBe('succeeded');
});

test('unrelated restaurants menu items cannot be preordered', function () {
    $foreign = Restaurant::create(['name' => 'Other', 'slug' => 'foreign-menu', 'is_active' => true]);
    $this->dish->update(['restaurant_id' => $foreign->id]);
    $this->postJson('/api/reservation-checkouts', $this->payload)->assertUnprocessable();
    $this->assertDatabaseCount('payments', 0);
});

test('kitchen actions cannot revive a cancelled preorder or bypass scheduled release', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    Sanctum::actingAs(User::factory()->admin($this->restaurant->id)->create());
    $data = ['order_id' => $r->preorder->id, 'status' => 'preparing'];
    $this->postJson('/api/webhooks/order-status', $data)->assertConflict();
    $this->travelTo($r->preorder->kitchen_release_at);
    app(ReservationPreorderService::class)->releaseDue();
    $this->postJson('/api/webhooks/order-status', $data)->assertSuccessful();
    app(ReservationRefundService::class)->cancel($r, 'restaurant');
    $this->postJson('/api/webhooks/order-status', ['order_id' => $r->preorder->id, 'status' => 'ready'])->assertConflict();
    expect($r->preorder->fresh()->status)->toBe('cancelled');
});

test('linking to an existing party session preserves unpaid additional food', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    $session = TableSession::create(['restaurant_id' => $this->restaurant->id, 'table_id' => $this->table->id, 'session_token' => 'already-arrived', 'status' => 'active', 'total_amount' => 500, 'payment_status' => 'unpaid']);
    \App\Models\Order::create(['restaurant_id' => $this->restaurant->id, 'table_id' => $this->table->id, 'session_id' => $session->id, 'order_number' => 'ADDITIONAL-1', 'order_type' => 'dine_in', 'subtotal' => 500, 'total_amount' => 500, 'status' => 'pending_payment', 'placed_at' => now()]);
    $this->table->update(['current_session_id' => $session->id, 'status' => 'occupied']);
    Sanctum::actingAs(User::factory()->admin($this->restaurant->id)->create());
    $path = '/api/admin/reservations/'.$r->id.'/status';
    $this->patchJson($path, ['status' => 'seated', 'confirm_new_session' => true])->assertConflict();
    $this->patchJson($path, ['status' => 'seated', 'session_id' => $session->id])->assertSuccessful();
    expect($session->fresh()->payment_status)->toBe('partial')->and((float) $session->fresh()->total_amount)->toBe(2740.0);
    expect($r->preorder->payments()->first()->session_id)->toBe($session->id);
});

test('the minute processor recovers a released ticket whose socket notification was lost', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    $this->travelTo($r->preorder->kitchen_release_at);
    $r->preorder->update(['status' => 'confirmed', 'confirmed_at' => now(), 'kitchen_released_at' => now(), 'kitchen_notified_at' => null]);
    $this->artisan('reservations:process-preorders')->assertSuccessful();
    Event::assertDispatched(OrderCreated::class, 1);
    expect($r->preorder->fresh()->kitchen_notified_at)->not->toBeNull();
});

test('reservation receipts can be downloaded securely from private local storage', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    \Illuminate\Support\Facades\Storage::fake('local');
    \Illuminate\Support\Facades\Storage::disk('local')->put('receipts/reservation-test.pdf', '%PDF-1.4 test receipt');
    $payment = $r->preorder->payments()->first();
    $payment->update(['receipt_s3_key' => 'receipts/reservation-test.pdf', 'receipt_url' => '/storage/receipts/reservation-test.pdf']);
    $root = '/api/reservation-management/'.$r->confirmation_code;
    $this->getJson($root.'/receipt')->assertForbidden();
    $this->get($root.'/receipt?token='.$r->managementToken())->assertSuccessful()->assertDownload($payment->transaction_id.'.pdf');
    $this->getJson($root.'?token='.$r->managementToken())->assertSuccessful()->assertJsonPath('data.preorder.payments.0.receipt_url', $root.'/receipt?token='.$r->managementToken());
    expect(json_encode(app(ReservationPreorderService::class)->view($r)))->not->toContain($r->managementToken());
});

test('administrators cannot delete a table while its paid reservation needs fulfillment', function () {
    $r = payPreorderForTest(createPreorderForTest($this->payload));
    Sanctum::actingAs(User::factory()->admin($this->restaurant->id)->create());
    $this->deleteJson('/api/admin/tables/'.$this->table->id)->assertConflict();
    expect($this->table->fresh())->not->toBeNull();
    app(ReservationRefundService::class)->cancel($r, 'restaurant');
    $this->deleteJson('/api/admin/tables/'.$this->table->id)->assertSuccessful();
});

test('late payment is fully refunded if its expired hold table has since been deleted', function () {
    $r = createPreorderForTest($this->payload);
    $this->travel(11)->minutes();
    Sanctum::actingAs(User::factory()->admin($this->restaurant->id)->create());
    $this->deleteJson('/api/admin/tables/'.$this->table->id)->assertSuccessful();
    payPreorderForTest($r);
    expect($r->fresh()->status)->toBe('cancelled')->and(PaymentRefund::first()->fee_paisa)->toBe(0)->and(PaymentRefund::first()->amount_paisa)->toBe(224000);
});
