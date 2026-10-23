<?php

use App\Events\ServiceRequestCreated;
use App\Events\ServiceRequestUpdated;
use App\Models\Restaurant;
use App\Models\ServiceRequest;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    Event::fake([ServiceRequestCreated::class, ServiceRequestUpdated::class]);

    $this->restaurant = Restaurant::create([
        'name' => 'Assistance Cafe',
        'slug' => 'assistance-cafe',
        'is_active' => true,
    ]);

    $this->table = Table::create([
        'restaurant_id' => $this->restaurant->id,
        'table_number' => 'A1',
        'qr_code' => 'assistance-table',
        'capacity' => 4,
        'status' => 'occupied',
    ]);

    $this->session = TableSession::create([
        'restaurant_id' => $this->restaurant->id,
        'table_id' => $this->table->id,
        'session_token' => 'assistance-session',
        'status' => 'active',
    ]);

    $this->payload = [
        'restaurant_id' => $this->restaurant->id,
        'table_id' => $this->table->id,
        'session_id' => $this->session->id,
    ];
});

test('guests can save and broadcast each assistance type', function (string $type) {
    $response = $this->postJson('/api/service-requests', [
        ...$this->payload,
        'request_type' => $type,
        'message' => 'Please bring some more to our table.',
    ])->assertCreated()
        ->assertJsonPath('data.request_type', $type)
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.priority', 'medium');

    $id = $response->json('data.id');

    $this->assertDatabaseHas('service_requests', [
        ...$this->payload,
        'id' => $id,
        'request_type' => $type,
        'user_id' => null,
        'message' => 'Please bring some more to our table.',
    ]);

    Event::assertDispatched(ServiceRequestCreated::class, function (ServiceRequestCreated $event) use ($id, $type): bool {
        $payload = $event->broadcastWith();

        return $payload['service_request']['id'] === $id
            && $payload['service_request']['request_type'] === $type
            && $payload['restaurant_id'] === $this->restaurant->id
            && $payload['session_id'] === $this->session->id
            && $event->broadcastOn()[0]->name === "service-requests.restaurant_{$this->restaurant->id}";
    });
})->with([
    'waiter_call', 'extra_naan_roti', 'extra_raita_salad', 'bill_request',
    'water_refill', 'cutlery', 'complaint', 'other',
]);

test('unsupported assistance types are rejected without saving or broadcasting', function () {
    $this->postJson('/api/service-requests', [
        ...$this->payload,
        'request_type' => 'unsupported',
    ])->assertUnprocessable()
        ->assertJsonPath('success', false)
        ->assertJsonValidationErrors('request_type');

    $this->assertDatabaseCount('service_requests', 0);
    Event::assertNotDispatched(ServiceRequestCreated::class);
});

test('new food requests can be listed and handled by staff or the socket webhook', function (string $type, string $handler) {
    $id = $this->postJson('/api/service-requests', [
        ...$this->payload,
        'request_type' => $type,
        'priority' => 'high',
    ])->assertCreated()->json('data.id');

    Sanctum::actingAs(User::factory()->admin($this->restaurant->id)->create());

    $this->getJson('/api/service-requests?view=current&request_type='.$type)
        ->assertSuccessful()
        ->assertJsonPath('data.data.0.id', $id)
        ->assertJsonPath('data.data.0.request_type', $type);

    foreach (['acknowledge' => 'acknowledged', 'resolve' => 'resolved'] as $action => $status) {
        $response = $handler === 'webhook'
            ? $this->postJson('/api/webhooks/waiter-request-action', ['request_id' => $id, 'action' => $action])
            : $this->patchJson("/api/service-requests/{$id}/{$action}");

        $response->assertSuccessful()
            ->assertJsonPath('data.request_type', $type)
            ->assertJsonPath('data.status', $status);

        Event::assertDispatched(ServiceRequestUpdated::class, fn (ServiceRequestUpdated $event): bool => $event->requestId === $id
            && $event->status === $status
            && $event->sessionId === $this->session->id);
    }

    $this->getJson('/api/service-requests?view=history&request_type='.$type)
        ->assertSuccessful()
        ->assertJsonPath('data.data.0.id', $id);
})->with(['extra_naan_roti', 'extra_raita_salad'])->with(['staff', 'webhook']);

test('the assistance type migration preserves existing requests during upgrades and rollbacks', function () {
    $migration = require database_path('migrations/2026_10_23_072708_add_extra_food_types_to_service_requests_table.php');
    $migration->down();

    $existing = ServiceRequest::create([...$this->payload, 'request_type' => 'waiter_call']);

    $migration->up();

    expect($existing->fresh()->request_type)->toBe('waiter_call');

    $naan = ServiceRequest::create([...$this->payload, 'request_type' => 'extra_naan_roti', 'message' => 'Two roti please']);
    $raita = ServiceRequest::create([...$this->payload, 'request_type' => 'extra_raita_salad']);

    $migration->down();

    expect($existing->fresh()->request_type)->toBe('waiter_call')
        ->and($naan->fresh()->request_type)->toBe('other')
        ->and($naan->fresh()->message)->toBe('Two roti please')
        ->and($raita->fresh()->request_type)->toBe('other');

    $migration->up();
});
