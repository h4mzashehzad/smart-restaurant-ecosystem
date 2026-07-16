<?php

use App\Models\Category;
use App\Models\Feedback;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Table;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

function feedbackRatingFixture(): array
{
    $restaurant = Restaurant::create([
        'name' => 'Rating Cafe',
        'slug' => 'rating-cafe-'.uniqid(),
        'is_active' => true,
    ]);

    $table = Table::create([
        'restaurant_id' => $restaurant->id,
        'table_number' => 'R1',
        'qr_code' => 'qr-rating-'.uniqid(),
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

    $ratedItem = MenuItem::create([
        'restaurant_id' => $restaurant->id,
        'category_id' => $category->id,
        'name' => 'Rated Burger',
        'slug' => 'rated-burger-'.uniqid(),
        'base_price' => 800,
        'is_available' => true,
        'average_rating' => 0,
        'review_count' => 0,
    ]);

    $unratedItem = MenuItem::create([
        'restaurant_id' => $restaurant->id,
        'category_id' => $category->id,
        'name' => 'Unrated Fries',
        'slug' => 'unrated-fries-'.uniqid(),
        'base_price' => 300,
        'is_available' => true,
        'average_rating' => 0,
        'review_count' => 0,
    ]);

    $order = Order::create([
        'restaurant_id' => $restaurant->id,
        'table_id' => $table->id,
        'order_number' => 'ORD-RATING-'.uniqid(),
        'order_type' => 'dine_in',
        'subtotal' => 800,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'total_amount' => 800,
        'status' => 'completed',
        'placed_at' => now(),
        'completed_at' => now(),
    ]);

    return compact('restaurant', 'table', 'category', 'ratedItem', 'unratedItem', 'order');
}

test('submitting item ratings updates menu item average_rating and review_count', function () {
    Http::fake();

    [
        'restaurant' => $restaurant,
        'ratedItem' => $ratedItem,
        'unratedItem' => $unratedItem,
        'order' => $order,
    ] = feedbackRatingFixture();

    $response = $this->postJson('/api/feedback', [
        'restaurant_id' => $restaurant->id,
        'order_id' => $order->id,
        'rating' => 4,
        'item_ratings' => [
            [
                'menu_item_id' => $ratedItem->id,
                'rating' => 5,
            ],
        ],
    ]);

    $response->assertCreated()->assertJsonPath('success', true);

    $ratedItem->refresh();
    $unratedItem->refresh();

    expect((float) $ratedItem->average_rating)->toBe(5.0)
        ->and($ratedItem->review_count)->toBe(1)
        ->and((float) $unratedItem->average_rating)->toBe(0.0)
        ->and($unratedItem->review_count)->toBe(0);
});

test('multiple item ratings produce a correct average', function () {
    Http::fake();

    [
        'restaurant' => $restaurant,
        'ratedItem' => $ratedItem,
        'order' => $firstOrder,
    ] = feedbackRatingFixture();

    $this->postJson('/api/feedback', [
        'restaurant_id' => $restaurant->id,
        'order_id' => $firstOrder->id,
        'rating' => 5,
        'item_ratings' => [
            ['menu_item_id' => $ratedItem->id, 'rating' => 5],
        ],
    ])->assertCreated();

    $secondOrder = Order::create([
        'restaurant_id' => $restaurant->id,
        'table_id' => $firstOrder->table_id,
        'order_number' => 'ORD-RATING-2-'.uniqid(),
        'order_type' => 'dine_in',
        'subtotal' => 800,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'total_amount' => 800,
        'status' => 'completed',
        'placed_at' => now(),
        'completed_at' => now(),
    ]);

    $this->postJson('/api/feedback', [
        'restaurant_id' => $restaurant->id,
        'order_id' => $secondOrder->id,
        'rating' => 3,
        'item_ratings' => [
            ['menu_item_id' => $ratedItem->id, 'rating' => 3],
        ],
    ])->assertCreated();

    $ratedItem->refresh();

    expect((float) $ratedItem->average_rating)->toBe(4.0)
        ->and($ratedItem->review_count)->toBe(2);
});

test('feedback without item ratings leaves average_rating unchanged', function () {
    Http::fake();

    [
        'restaurant' => $restaurant,
        'ratedItem' => $ratedItem,
        'order' => $order,
    ] = feedbackRatingFixture();

    $this->postJson('/api/feedback', [
        'restaurant_id' => $restaurant->id,
        'order_id' => $order->id,
        'rating' => 4,
        'review_text' => 'Nice place overall',
    ])->assertCreated();

    $ratedItem->refresh();

    expect((float) $ratedItem->average_rating)->toBe(0.0)
        ->and($ratedItem->review_count)->toBe(0)
        ->and(Feedback::query()->count())->toBe(1);
});
