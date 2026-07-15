<?php

use App\Models\Category;
use App\Models\Feedback;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function analyticsFixture(): array
{
    $restaurant = Restaurant::create([
        'name' => 'Analytics Cafe',
        'slug' => 'analytics-cafe-'.uniqid(),
        'is_active' => true,
    ]);

    $table = Table::create([
        'restaurant_id' => $restaurant->id,
        'table_number' => 'A1',
        'qr_code' => 'qr-analytics-'.uniqid(),
        'capacity' => 4,
        'status' => 'available',
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
        'name' => 'Analytics Burger',
        'slug' => 'analytics-burger-'.uniqid(),
        'base_price' => 800,
        'is_available' => true,
        'average_rating' => 4.2,
    ]);

    $customer = User::factory()->create([
        'role' => 'customer',
        'loyalty_tier' => 'silver',
        'loyalty_points' => 600,
    ]);

    $admin = User::factory()->admin($restaurant->id)->create();

    $order = Order::create([
        'restaurant_id' => $restaurant->id,
        'table_id' => $table->id,
        'user_id' => $customer->id,
        'order_number' => 'ORD-ANALYTICS-'.uniqid(),
        'order_type' => 'dine_in',
        'subtotal' => 800,
        'tax_amount' => 96,
        'discount_amount' => 0,
        'total_amount' => 896,
        'status' => 'completed',
        'placed_at' => now()->subHours(2),
        'confirmed_at' => now()->subHours(2)->addMinutes(3),
        'ready_at' => now()->subHours(2)->addMinutes(18),
        'completed_at' => now()->subHours(2)->addMinutes(25),
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'menu_item_id' => $menuItem->id,
        'quantity' => 1,
        'unit_price' => 800,
        'total_price' => 800,
    ]);

    Feedback::create([
        'restaurant_id' => $restaurant->id,
        'order_id' => $order->id,
        'user_id' => $customer->id,
        'rating' => 5,
        'review_text' => 'Great food',
        'sentiment_score' => 0.8,
        'sentiment_label' => 'positive',
        'sentiment_confidence' => 0.9,
        'is_flagged' => false,
    ]);

    return compact('restaurant', 'table', 'category', 'menuItem', 'customer', 'admin', 'order');
}

test('admin can fetch revenue analytics', function () {
    ['admin' => $admin] = analyticsFixture();
    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/analytics/revenue?period=daily&days=30')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonStructure(['data' => [['period', 'total_revenue', 'total_orders', 'avg_order_value']]]);
});

test('admin can fetch peak hours heatmap matrix', function () {
    ['admin' => $admin] = analyticsFixture();
    Sanctum::actingAs($admin);

    $response = $this->getJson('/api/admin/analytics/peak-hours?days=30')
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    expect($response->json('data.0'))->toHaveKeys(['day_of_week', 'hour', 'order_count', 'revenue']);
});

test('admin can fetch fulfillment and loyalty insights', function () {
    ['admin' => $admin] = analyticsFixture();
    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/analytics/fulfillment-performance?days=30')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'data' => [
                'total_orders',
                'completed_orders',
                'cancellation_rate',
                'avg_total_fulfillment_minutes',
            ],
        ]);

    $this->getJson('/api/admin/analytics/loyalty-insights?days=30')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonStructure([
            'data' => [
                'loyalty_revenue',
                'guest_revenue',
                'tier_distribution',
                'churn_risk_customers',
            ],
        ]);
});

test('demand forecast returns insufficient_data when empty', function () {
    ['admin' => $admin] = analyticsFixture();
    Sanctum::actingAs($admin);

    $this->getJson('/api/admin/analytics/demand-forecast')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.insufficient_data', true)
        ->assertJsonPath('data.items', []);
});

test('customer cannot access analytics endpoints', function () {
    ['customer' => $customer] = analyticsFixture();
    Sanctum::actingAs($customer);

    $this->getJson('/api/admin/analytics/revenue')->assertForbidden();
});
