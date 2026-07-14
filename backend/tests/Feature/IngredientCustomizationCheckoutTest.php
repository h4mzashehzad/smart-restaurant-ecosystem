<?php

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\OrderItemCustomization;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\TableSession;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function checkoutFixture(): array
{
    $restaurant = Restaurant::create([
        'name' => 'Checkout Cafe',
        'slug' => 'checkout-cafe',
        'is_active' => true,
    ]);

    $table = Table::create([
        'restaurant_id' => $restaurant->id,
        'table_number' => 'T1',
        'qr_code' => 'qr-checkout-1',
        'capacity' => 4,
        'status' => 'occupied',
    ]);

    $session = TableSession::create([
        'table_id' => $table->id,
        'restaurant_id' => $restaurant->id,
        'session_token' => 'tok-checkout-1',
        'started_at' => now(),
        'status' => 'active',
        'payment_status' => 'unpaid',
        'total_amount' => 0,
    ]);

    $category = Category::create([
        'restaurant_id' => $restaurant->id,
        'name' => 'Mains',
        'slug' => 'mains',
        'display_order' => 1,
        'is_active' => true,
    ]);

    $menuItem = MenuItem::create([
        'restaurant_id' => $restaurant->id,
        'category_id' => $category->id,
        'name' => 'Classic Burger',
        'slug' => 'classic-burger',
        'base_price' => 500,
        'is_available' => true,
    ]);

    $cheese = Ingredient::create([
        'restaurant_id' => $restaurant->id,
        'name' => 'Cheese Slice',
        'unit' => 'piece',
        'cost_per_unit' => 25,
        'stock_quantity' => 100,
        'minimum_threshold' => 10,
        'is_allergen' => true,
        'allergen_type' => 'Dairy',
    ]);

    $menuItem->ingredients()->attach($cheese->id, [
        'quantity' => 1,
        'is_optional' => false,
        'is_removable' => true,
        'is_adjustable' => true,
        'min_quantity' => 0,
        'max_quantity' => 3,
        'extra_unit_price' => 40,
        'additional_price' => 0,
    ]);

    return compact('restaurant', 'table', 'session', 'menuItem', 'cheese');
}

test('checkout prices modify customizations into the draft order total', function () {
    ['table' => $table, 'session' => $session, 'menuItem' => $menuItem, 'cheese' => $cheese] = checkoutFixture();

    // base 500 + (2 extra cheese * 40) = 580; tax 12% = 69.6; total = 649.6
    $response = $this->postJson('/api/payments/checkout', [
        'session_id' => $session->id,
        'table_id' => $table->id,
        'items' => [
            [
                'menu_item_id' => $menuItem->id,
                'quantity' => 1,
                'customizations' => [
                    [
                        'ingredient_id' => $cheese->id,
                        'action' => 'modify',
                        'quantity' => 3,
                    ],
                ],
            ],
        ],
        'mode' => 'full',
        'payment_method' => 'cash',
    ]);

    $response->assertCreated();

    expect((float) $response->json('data.order.subtotal'))->toBe(580.0)
        ->and((float) $response->json('data.order.tax_amount'))->toBe(69.6)
        ->and((float) $response->json('data.order.total_amount'))->toBe(649.6);

    $orderId = $response->json('data.order.id');
    $customization = OrderItemCustomization::whereHas('orderItem', fn ($q) => $q->where('order_id', $orderId))->first();

    expect($customization)->not->toBeNull()
        ->and((float) $customization->quantity)->toBe(3.0)
        ->and((float) $customization->price_adjustment)->toBe(80.0)
        ->and($customization->action)->toBe('modify');
});

test('checkout rejects out of range ingredient quantities', function () {
    ['table' => $table, 'session' => $session, 'menuItem' => $menuItem, 'cheese' => $cheese] = checkoutFixture();

    $response = $this->postJson('/api/payments/checkout', [
        'session_id' => $session->id,
        'table_id' => $table->id,
        'items' => [
            [
                'menu_item_id' => $menuItem->id,
                'quantity' => 1,
                'customizations' => [
                    [
                        'ingredient_id' => $cheese->id,
                        'action' => 'modify',
                        'quantity' => 9,
                    ],
                ],
            ],
        ],
        'mode' => 'full',
        'payment_method' => 'cash',
    ]);

    $response->assertStatus(422)
        ->assertJsonPath('success', false);
});
