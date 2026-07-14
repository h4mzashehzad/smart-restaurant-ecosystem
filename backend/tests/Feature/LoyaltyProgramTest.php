<?php

use App\Models\Category;
use App\Models\LoyaltyTransaction;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Restaurant;
use App\Models\SessionParticipant;
use App\Models\SplitBillItem;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\User;
use App\Services\LoyaltyService;
use App\Services\PaymentCompletionService;
use App\Services\SplitBillService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function loyaltyFixture(array $userAttrs = []): array
{
    $restaurant = Restaurant::create([
        'name' => 'Loyalty Bistro',
        'slug' => 'loyalty-bistro-'.uniqid(),
        'is_active' => true,
    ]);

    $table = Table::create([
        'restaurant_id' => $restaurant->id,
        'table_number' => 'L1',
        'qr_code' => 'qr-loyalty-'.uniqid(),
        'capacity' => 4,
        'status' => 'occupied',
    ]);

    $session = TableSession::create([
        'table_id' => $table->id,
        'restaurant_id' => $restaurant->id,
        'session_token' => 'tok-loyalty-'.uniqid(),
        'started_at' => now(),
        'status' => 'active',
        'payment_status' => 'unpaid',
        'total_amount' => 0,
    ]);

    $category = Category::create([
        'restaurant_id' => $restaurant->id,
        'name' => 'Mains',
        'slug' => 'mains-'.uniqid(),
        'display_order' => 1,
        'is_active' => true,
    ]);

    $menuItem = MenuItem::create([
        'restaurant_id' => $restaurant->id,
        'category_id' => $category->id,
        'name' => 'Loyalty Steak',
        'slug' => 'loyalty-steak-'.uniqid(),
        'base_price' => 1000,
        'is_available' => true,
    ]);

    $user = User::factory()->create(array_merge([
        'role' => 'customer',
        'loyalty_tier' => 'bronze',
        'loyalty_points' => 0,
    ], $userAttrs));

    return compact('restaurant', 'table', 'session', 'menuItem', 'user');
}

test('bronze discount applies for logged-in user when subtotal meets threshold', function () {
    ['table' => $table, 'session' => $session, 'menuItem' => $menuItem, 'user' => $user] = loyaltyFixture([
        'loyalty_tier' => 'bronze',
        'loyalty_points' => 100,
    ]);

    Sanctum::actingAs($user);

    // 2 × 1000 = 2000 subtotal → 5% = 100 discount → taxable 1900 → tax 228 → total 2128
    $response = $this->postJson('/api/payments/checkout', [
        'session_id' => $session->id,
        'table_id' => $table->id,
        'items' => [
            ['menu_item_id' => $menuItem->id, 'quantity' => 2],
        ],
        'mode' => 'full',
        'payment_method' => 'cash',
    ]);

    $response->assertCreated();

    expect((float) $response->json('data.order.subtotal'))->toBe(2000.0)
        ->and((float) $response->json('data.order.discount_amount'))->toBe(100.0)
        ->and((float) $response->json('data.order.tax_amount'))->toBe(228.0)
        ->and((float) $response->json('data.order.total_amount'))->toBe(2128.0);
});

test('bronze discount is zero when subtotal is below threshold', function () {
    ['table' => $table, 'session' => $session, 'menuItem' => $menuItem, 'user' => $user] = loyaltyFixture([
        'loyalty_tier' => 'bronze',
    ]);

    // Use a cheaper item for under-threshold order
    $menuItem->update(['base_price' => 500]);

    Sanctum::actingAs($user);

    $response = $this->postJson('/api/payments/checkout', [
        'session_id' => $session->id,
        'table_id' => $table->id,
        'items' => [
            ['menu_item_id' => $menuItem->id, 'quantity' => 1],
        ],
        'mode' => 'full',
        'payment_method' => 'cash',
    ]);

    $response->assertCreated();

    expect((float) $response->json('data.order.subtotal'))->toBe(500.0)
        ->and((float) $response->json('data.order.discount_amount'))->toBe(0.0)
        ->and((float) $response->json('data.order.tax_amount'))->toBe(60.0)
        ->and((float) $response->json('data.order.total_amount'))->toBe(560.0);
});

test('guest checkout receives no loyalty discount', function () {
    ['table' => $table, 'session' => $session, 'menuItem' => $menuItem] = loyaltyFixture();

    $response = $this->postJson('/api/payments/checkout', [
        'session_id' => $session->id,
        'table_id' => $table->id,
        'items' => [
            ['menu_item_id' => $menuItem->id, 'quantity' => 2],
        ],
        'mode' => 'full',
        'payment_method' => 'cash',
    ]);

    $response->assertCreated();

    expect((float) $response->json('data.order.discount_amount'))->toBe(0.0)
        ->and((float) $response->json('data.order.tax_amount'))->toBe(240.0)
        ->and((float) $response->json('data.order.total_amount'))->toBe(2240.0);
});

test('points are awarded once on payment completion using discounted subtotal', function () {
    ['restaurant' => $restaurant, 'table' => $table, 'session' => $session, 'user' => $user] = loyaltyFixture([
        'loyalty_tier' => 'bronze',
        'loyalty_points' => 0,
    ]);

    $order = Order::create([
        'restaurant_id' => $restaurant->id,
        'table_id' => $table->id,
        'session_id' => $session->id,
        'user_id' => $user->id,
        'order_number' => 'ORD-LOYALTY-1',
        'order_type' => 'dine_in',
        'subtotal' => 2000,
        'tax_amount' => 228,
        'discount_amount' => 100,
        'total_amount' => 2128,
        'status' => 'pending_payment',
        'placed_at' => now(),
    ]);

    $payment = Payment::create([
        'order_id' => $order->id,
        'session_id' => $session->id,
        'user_id' => $user->id,
        'payment_method' => 'cash',
        'payment_type' => 'full',
        'amount' => 2128,
        'transaction_id' => 'TXN-TEST-1',
        'status' => 'pending',
    ]);

    app(PaymentCompletionService::class)->markCompleted($payment);

    $user->refresh();
    // Eligible = 2000 - 100 = 1900 → floor(1900/20) = 95 points
    expect($user->loyalty_points)->toBe(95)
        ->and($user->loyalty_tier)->toBe('bronze')
        ->and(LoyaltyTransaction::where('order_id', $order->id)->where('transaction_type', 'earned')->count())->toBe(1);

    // Idempotent — second completion must not double-award
    app(PaymentCompletionService::class)->markCompleted($payment->fresh());
    $user->refresh();
    expect($user->loyalty_points)->toBe(95)
        ->and(LoyaltyTransaction::where('order_id', $order->id)->where('transaction_type', 'earned')->count())->toBe(1);
});

test('points and tier are reversed when a paid order is cancelled', function () {
    ['restaurant' => $restaurant, 'table' => $table, 'session' => $session, 'user' => $user] = loyaltyFixture([
        'loyalty_tier' => 'silver',
        'loyalty_points' => 520,
    ]);

    $order = Order::create([
        'restaurant_id' => $restaurant->id,
        'table_id' => $table->id,
        'session_id' => $session->id,
        'user_id' => $user->id,
        'order_number' => 'ORD-LOYALTY-2',
        'order_type' => 'dine_in',
        'subtotal' => 2000,
        'tax_amount' => 216,
        'discount_amount' => 200,
        'total_amount' => 2016,
        'status' => 'confirmed',
        'placed_at' => now(),
        'confirmed_at' => now(),
    ]);

    LoyaltyTransaction::create([
        'user_id' => $user->id,
        'order_id' => $order->id,
        'transaction_type' => 'earned',
        'points' => 90,
        'balance_after' => 520,
        'description' => "Earned from order {$order->order_number}",
    ]);

    $admin = User::factory()->admin($restaurant->id)->create();
    Sanctum::actingAs($admin);

    $this->patchJson("/api/admin/orders/{$order->id}/cancel", [
        'reason' => 'Customer left',
    ])->assertSuccessful();

    $user->refresh();
    expect($user->loyalty_points)->toBe(430)
        ->and($user->loyalty_tier)->toBe('bronze')
        ->and(LoyaltyTransaction::where('order_id', $order->id)->where('transaction_type', 'adjusted')->count())->toBe(1);
});

test('itemized split prorates loyalty discount across participants', function () {
    ['restaurant' => $restaurant, 'table' => $table, 'session' => $session, 'menuItem' => $menuItem, 'user' => $user] = loyaltyFixture([
        'loyalty_tier' => 'silver',
        'loyalty_points' => 600,
    ]);

    $order = Order::create([
        'restaurant_id' => $restaurant->id,
        'table_id' => $table->id,
        'session_id' => $session->id,
        'user_id' => $user->id,
        'order_number' => 'ORD-LOYALTY-SPLIT',
        'order_type' => 'dine_in',
        'subtotal' => 2000,
        'tax_amount' => 216,
        'discount_amount' => 200,
        'total_amount' => 2016,
        'status' => 'pending_payment',
        'placed_at' => now(),
    ]);

    $itemA = OrderItem::create([
        'order_id' => $order->id,
        'menu_item_id' => $menuItem->id,
        'quantity' => 1,
        'unit_price' => 1000,
        'total_price' => 1000,
    ]);
    $itemB = OrderItem::create([
        'order_id' => $order->id,
        'menu_item_id' => $menuItem->id,
        'quantity' => 1,
        'unit_price' => 1000,
        'total_price' => 1000,
    ]);

    $p1 = SessionParticipant::create([
        'session_id' => $session->id,
        'user_id' => $user->id,
        'device_id' => 'dev-1',
        'is_host' => true,
        'joined_at' => now(),
    ]);
    $p2 = SessionParticipant::create([
        'session_id' => $session->id,
        'user_id' => null,
        'device_id' => 'dev-2',
        'is_host' => false,
        'joined_at' => now(),
    ]);

    SplitBillItem::create([
        'order_item_id' => $itemA->id,
        'unit_index' => 0,
        'participant_id' => $p1->id,
        'amount' => 1000,
    ]);
    SplitBillItem::create([
        'order_item_id' => $itemB->id,
        'unit_index' => 0,
        'participant_id' => $p2->id,
        'amount' => 1000,
    ]);

    $payments = app(SplitBillService::class)->setupItemizedSplit($order, $session);

    expect($payments)->toHaveCount(2)
        ->and(round((float) $payments->sum('amount'), 2))->toBe(2016.0);

    foreach ($payments as $payment) {
        // Each claimed 1000 of 2000 → tax share 108, discount share 100 → amount 1008
        expect((float) $payment->amount)->toBe(1008.0);
    }
});

test('loyalty points snapshot includes tier progress', function () {
    $user = User::factory()->create([
        'role' => 'customer',
        'loyalty_tier' => 'bronze',
        'loyalty_points' => 320,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson('/api/loyalty/points');

    $response->assertSuccessful()
        ->assertJsonPath('data.loyalty_points', 320)
        ->assertJsonPath('data.loyalty_tier', 'bronze')
        ->assertJsonPath('data.current_tier.discount_percent', 5)
        ->assertJsonPath('data.next_tier.name', 'silver')
        ->assertJsonPath('data.next_tier.points_needed', 180);
});

test('admin loyalty endpoints are restaurant scoped', function () {
    $restaurant = Restaurant::create([
        'name' => 'Admin Loyalty Rest',
        'slug' => 'admin-loyalty-'.uniqid(),
        'is_active' => true,
    ]);
    $other = Restaurant::create([
        'name' => 'Other Rest',
        'slug' => 'other-loyalty-'.uniqid(),
        'is_active' => true,
    ]);

    $customer = User::factory()->create([
        'role' => 'customer',
        'loyalty_tier' => 'gold',
        'loyalty_points' => 1600,
        'name' => 'Gold Guest',
    ]);
    $outsider = User::factory()->create([
        'role' => 'customer',
        'loyalty_tier' => 'silver',
        'loyalty_points' => 700,
        'name' => 'Other Guest',
    ]);

    Order::create([
        'restaurant_id' => $restaurant->id,
        'user_id' => $customer->id,
        'order_number' => 'ORD-ADM-1',
        'order_type' => 'dine_in',
        'subtotal' => 1000,
        'tax_amount' => 120,
        'discount_amount' => 0,
        'total_amount' => 1120,
        'status' => 'confirmed',
        'placed_at' => now(),
    ]);
    Order::create([
        'restaurant_id' => $other->id,
        'user_id' => $outsider->id,
        'order_number' => 'ORD-ADM-2',
        'order_type' => 'dine_in',
        'subtotal' => 1000,
        'tax_amount' => 120,
        'discount_amount' => 0,
        'total_amount' => 1120,
        'status' => 'confirmed',
        'placed_at' => now(),
    ]);

    $admin = User::factory()->admin($restaurant->id)->create();
    Sanctum::actingAs($admin);

    $list = $this->getJson('/api/admin/loyalty/customers');
    $list->assertSuccessful();
    $names = collect($list->json('data.data'))->pluck('name');
    expect($names)->toContain('Gold Guest')
        ->and($names)->not->toContain('Other Guest');

    $summary = $this->getJson('/api/admin/loyalty/summary');
    $summary->assertSuccessful()
        ->assertJsonPath('data.total_customers', 1)
        ->assertJsonPath('data.gold_count', 1);

    $this->getJson("/api/admin/loyalty/customers/{$customer->id}")->assertSuccessful();
    $this->getJson("/api/admin/loyalty/customers/{$outsider->id}")->assertNotFound();
});

test('loyalty service maps tiers from points correctly', function () {
    $service = app(LoyaltyService::class);

    expect($service->tierForPoints(0))->toBe('bronze')
        ->and($service->tierForPoints(499))->toBe('bronze')
        ->and($service->tierForPoints(500))->toBe('silver')
        ->and($service->tierForPoints(1499))->toBe('silver')
        ->and($service->tierForPoints(1500))->toBe('gold');
});
