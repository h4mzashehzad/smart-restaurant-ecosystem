<?php

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);
function isolatedRestaurant(string $slug): array
{
    $restaurant = Restaurant::create(['name' => ucfirst($slug), 'slug' => $slug, 'is_active' => true]);
    $admin = User::factory()->admin($restaurant->id)->create();
    $category = Category::create(['restaurant_id' => $restaurant->id, 'name' => 'Mains', 'slug' => 'mains']);
    $ingredient = Ingredient::create(['restaurant_id' => $restaurant->id, 'name' => $slug.' ingredient', 'unit' => 'piece']);
    $item = MenuItem::create(['restaurant_id' => $restaurant->id, 'category_id' => $category->id, 'name' => $slug.' dish', 'slug' => $slug.'-dish', 'base_price' => 800, 'is_available' => true]);
    $table = Table::create(['restaurant_id' => $restaurant->id, 'table_number' => '1', 'qr_code' => $slug.'-qr', 'capacity' => 4, 'status' => 'available']);
    $session = TableSession::create(['restaurant_id' => $restaurant->id, 'table_id' => $table->id, 'session_token' => $slug.'-session', 'status' => 'active', 'started_at' => now()]);

    return compact('restaurant', 'admin', 'category', 'ingredient', 'item', 'table', 'session');
}
test('admin lists only their own restaurant despite supplied restaurant identifiers', function () {
    $one = isolatedRestaurant('one');
    $two = isolatedRestaurant('two');
    Sanctum::actingAs($one['admin']);
    $this->getJson('/api/admin/menu/items?restaurant_id='.$two['restaurant']->id)->assertSuccessful()->assertJsonPath('data.data.0.id', $one['item']->id)->assertJsonCount(1, 'data.data');
    $this->getJson('/api/admin/tables?restaurant_id='.$two['restaurant']->id)->assertSuccessful()->assertJsonPath('data.0.id', $one['table']->id)->assertJsonCount(1, 'data');
    $this->getJson('/api/admin/team')->assertSuccessful()->assertJsonPath('data.0.id', $one['admin']->id)->assertJsonCount(1, 'data');
    $this->getJson('/api/admin/ingredients')->assertSuccessful()->assertJsonPath('data.0.id', $one['ingredient']->id)->assertJsonCount(1, 'data');
    $this->getJson('/api/admin/tables/'.$two['table']->id)->assertNotFound();
    $this->patchJson('/api/admin/team/'.$two['admin']->id, ['name' => 'Intruder'])->assertNotFound();
    $this->patchJson('/api/admin/menu/items/'.$two['item']->id, ['name' => 'Intruder'])->assertNotFound();
});
test('legacy menu updates cannot move dishes or attach another restaurant category', function () {
    $one = isolatedRestaurant('one');
    $two = isolatedRestaurant('two');
    Sanctum::actingAs($one['admin']);
    $this->patchJson('/api/admin/menu-items/'.$one['item']->id, ['category_id' => $two['category']->id])->assertUnprocessable();
    $this->patchJson('/api/admin/menu-items/'.$one['item']->id, ['restaurant_id' => $two['restaurant']->id, 'name' => 'Still mine'])->assertSuccessful();
    expect($one['item']->fresh()->restaurant_id)->toBe($one['restaurant']->id);
});
test('public recommendations search and menu are restaurant scoped', function () {
    $one = isolatedRestaurant('one');
    $two = isolatedRestaurant('two');
    foreach (['/api/menu-items/recommended', '/api/menu-items/search?q=dish'] as $path) {
        $url = $path.(str_contains($path, '?') ? '&' : '?').'restaurant_id='.$two['restaurant']->id;
        $this->getJson($url)->assertSuccessful()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $two['item']->id);
    }
    $this->getJson('/api/restaurants/'.$two['restaurant']->id.'/menu')->assertSuccessful()->assertJsonPath('data.0.menu_items.0.id', $two['item']->id);
    $this->getJson('/api/menu-items/recommended')->assertUnprocessable();
    $customer = User::factory()->create();
    $customer->aiRecommendations()->create(['menu_item_id' => $one['item']->id, 'recommendation_score' => .95, 'recommendation_reason' => 'Test', 'generated_at' => now()]);
    Sanctum::actingAs($customer);
    $this->getJson('/api/menu-items/recommended?restaurant_id='.$two['restaurant']->id)->assertSuccessful()->assertJsonPath('data.0.id', $two['item']->id);
});
test('orders and checkout reject foreign menu items and table references without creating records', function () {
    $one = isolatedRestaurant('one');
    $two = isolatedRestaurant('two');
    foreach (['/api/orders', '/api/payments/checkout'] as $path) {
        $this->postJson($path, ['session_id' => $one['session']->id, 'table_id' => $one['table']->id, 'items' => [['menu_item_id' => $two['item']->id, 'quantity' => 1]], 'mode' => 'full', 'payment_method' => 'cash'])->assertUnprocessable();
        $this->postJson($path, ['session_id' => $one['session']->id, 'table_id' => $two['table']->id, 'items' => [['menu_item_id' => $one['item']->id, 'quantity' => 1]], 'mode' => 'full', 'payment_method' => 'cash'])->assertUnprocessable();
    }
    $this->assertDatabaseCount('orders', 0);
    $this->assertDatabaseCount('payments', 0);
});

test('operational webhooks and cash confirmation reject another restaurant operator', function () {
    $one = isolatedRestaurant('one');
    $two = isolatedRestaurant('two');
    $order = \App\Models\Order::create(['restaurant_id' => $two['restaurant']->id, 'table_id' => $two['table']->id, 'session_id' => $two['session']->id, 'order_number' => 'FOREIGN-ORDER', 'order_type' => 'dine_in', 'subtotal' => 800, 'tax_amount' => 96, 'total_amount' => 896, 'status' => 'pending', 'placed_at' => now()]);
    $payment = \App\Models\Payment::create(['order_id' => $order->id, 'session_id' => $two['session']->id, 'amount' => 896, 'payment_type' => 'full', 'payment_method' => 'cash', 'status' => 'pending']);
    $queue = \App\Models\QueueEntry::create(['restaurant_id' => $two['restaurant']->id, 'guest_name' => 'Guest', 'guest_phone' => '+923001234999', 'party_size' => 2, 'queue_number' => 1, 'status' => 'waiting']);
    $service = \App\Models\ServiceRequest::create(['restaurant_id' => $two['restaurant']->id, 'table_id' => $two['table']->id, 'session_id' => $two['session']->id, 'request_type' => 'water_refill', 'status' => 'pending']);
    $this->postJson('/api/webhooks/order-status', ['order_id' => $order->id, 'status' => 'preparing'])->assertUnauthorized();
    Sanctum::actingAs($one['admin']);
    $this->postJson('/api/webhooks/order-status', ['order_id' => $order->id, 'status' => 'preparing'])->assertNotFound();
    $this->postJson('/api/webhooks/queue-status', ['entry_id' => $queue->id, 'status' => 'called'])->assertNotFound();
    $this->patchJson('/api/admin/queue/'.$queue->id.'/status', ['status' => 'called'])->assertNotFound();
    $this->postJson('/api/webhooks/waiter-request-action', ['request_id' => $service->id, 'action' => 'resolve'])->assertNotFound();
    $this->postJson('/api/payments/'.$payment->id.'/confirm-cash')->assertNotFound();
    expect($order->fresh()->status)->toBe('pending')->and($payment->fresh()->status)->toBe('pending')->and($queue->fresh()->status)->toBe('waiting')->and($service->fresh()->status)->toBe('pending');
});

test('table qr downloads work without cloud image storage and stay scoped', function () {
    $one = isolatedRestaurant('one');
    $two = isolatedRestaurant('two');
    Sanctum::actingAs($one['admin']);
    $this->get('/api/admin/tables/'.$one['table']->id.'/qr-download', ['Accept' => 'application/json'])->assertSuccessful()->assertHeader('Content-Type', 'image/svg+xml');
    $this->getJson('/api/admin/tables/'.$two['table']->id.'/qr-download')->assertNotFound();
});
