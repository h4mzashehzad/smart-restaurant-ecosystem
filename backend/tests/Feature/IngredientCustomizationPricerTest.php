<?php

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Services\IngredientCustomizationPricer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

function makeAdjustableBurger(): array
{
    $restaurant = Restaurant::create([
        'name' => 'Test Bistro',
        'slug' => 'test-bistro',
        'is_active' => true,
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
        'name' => 'Beef Burger',
        'slug' => 'beef-burger',
        'base_price' => 850,
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
        'max_quantity' => 4,
        'extra_unit_price' => 50,
        'additional_price' => 0,
    ]);

    return compact('restaurant', 'menuItem', 'cheese');
}

test('pricer charges only units above the default included quantity', function () {
    ['menuItem' => $menuItem, 'cheese' => $cheese] = makeAdjustableBurger();

    $result = app(IngredientCustomizationPricer::class)->price($menuItem, [
        [
            'ingredient_id' => $cheese->id,
            'action' => 'modify',
            'quantity' => 3,
        ],
    ]);

    expect($result['unit_price_adjustment'])->toBe(100.0)
        ->and($result['normalized_rows'])->toHaveCount(1)
        ->and($result['normalized_rows'][0]['price_adjustment'])->toBe(100.0)
        ->and($result['normalized_rows'][0]['quantity'])->toBe(3.0);
});

test('pricer does not refund when quantity is reduced below default', function () {
    ['menuItem' => $menuItem, 'cheese' => $cheese] = makeAdjustableBurger();

    $result = app(IngredientCustomizationPricer::class)->price($menuItem, [
        [
            'ingredient_id' => $cheese->id,
            'action' => 'modify',
            'quantity' => 0,
        ],
    ]);

    expect($result['unit_price_adjustment'])->toBe(0.0)
        ->and($result['normalized_rows'][0]['price_adjustment'])->toBe(0.0);
});

test('pricer rejects quantities above the configured max', function () {
    ['menuItem' => $menuItem, 'cheese' => $cheese] = makeAdjustableBurger();

    app(IngredientCustomizationPricer::class)->price($menuItem, [
        [
            'ingredient_id' => $cheese->id,
            'action' => 'modify',
            'quantity' => 5,
        ],
    ]);
})->throws(ValidationException::class);

test('pricer rejects modify on non-adjustable ingredients', function () {
    ['restaurant' => $restaurant, 'menuItem' => $menuItem] = makeAdjustableBurger();

    $lettuce = Ingredient::create([
        'restaurant_id' => $restaurant->id,
        'name' => 'Lettuce Leaf',
        'unit' => 'piece',
        'cost_per_unit' => 5,
        'stock_quantity' => 100,
        'minimum_threshold' => 10,
        'is_allergen' => false,
    ]);

    $menuItem->ingredients()->attach($lettuce->id, [
        'quantity' => 1,
        'is_optional' => false,
        'is_removable' => true,
        'is_adjustable' => false,
        'min_quantity' => 0,
        'max_quantity' => null,
        'extra_unit_price' => 0,
        'additional_price' => 0,
    ]);

    app(IngredientCustomizationPricer::class)->price($menuItem, [
        [
            'ingredient_id' => $lettuce->id,
            'action' => 'modify',
            'quantity' => 2,
        ],
    ]);
})->throws(ValidationException::class);
