<?php

use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\Restaurant;
use App\Models\User;
use Database\Seeders\AdditionalRestaurantsSeeder;
use Database\Seeders\RestaurantMenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);
test('four complete restaurant demos reuse smaller menus and rerun without touching Darbar', function () {
    $this->seed(RestaurantMenuSeeder::class);
    $darbar = Restaurant::first();
    $originalItems = $darbar->menuItems()->pluck('id')->all();
    $sourcePairs = $darbar->menuItems()->get()->mapWithKeys(fn ($item) => [$item->name => $item->image_url]);
    $admin = User::factory()->admin($darbar->id)->create();
    $this->seed(AdditionalRestaurantsSeeder::class);
    expect(Restaurant::count())->toBe(5);
    foreach (AdditionalRestaurantsSeeder::RESTAURANTS as $definition) {
        $restaurant = Restaurant::where('slug', $definition['slug'])->firstOrFail();
        expect($restaurant->menuItems()->count())->toBe($definition['items'])->toBeLessThan(count($originalItems));
        expect($restaurant->orders()->count())->toBeGreaterThan(100)->and($restaurant->tables()->count())->toBe($definition['tables']);
        expect($restaurant->feedback()->count())->toBeGreaterThan(0)->and($restaurant->demandForecasts()->count())->toBeGreaterThan(0);
        expect($restaurant->orders()->where('status', 'preparing')->exists())->toBeTrue();
        expect(\App\Models\Payment::whereHas('order', fn ($q) => $q->where('restaurant_id', $restaurant->id))->where('status', 'pending')->exists())->toBeTrue();
        expect($restaurant->reservations()->count())->toBe(6)->and($restaurant->queueEntries()->count())->toBe(3)->and($restaurant->serviceRequests()->count())->toBe(8);
        foreach ($restaurant->menuItems()->with('ingredients', 'category')->get() as $item) {
            expect($sourcePairs[$item->name])->toBe($item->image_url)->and($item->category->restaurant_id)->toBe($restaurant->id);
            foreach ($item->ingredients as $ingredient) {
                expect($ingredient->restaurant_id)->toBe($restaurant->id);
            }
        }
        $owner = User::where('email', 'admin@'.$definition['slug'].'.test')->firstOrFail();
        expect($owner->restaurant_id)->toBe($restaurant->id)->and(Hash::check('RestaurantDemo!2026', $owner->password))->toBeTrue();
        $this->postJson('/api/auth/login', ['identifier' => $owner->email, 'password' => 'RestaurantDemo!2026'])->assertSuccessful()->assertJsonPath('data.user.restaurant_id', $restaurant->id);
    }
    $itemIds = MenuItem::pluck('id')->all();
    $ingredientIds = Ingredient::pluck('id')->all();
    $this->seed(AdditionalRestaurantsSeeder::class);
    expect(Restaurant::count())->toBe(5)->and(MenuItem::pluck('id')->all())->toBe($itemIds)->and(Ingredient::pluck('id')->all())->toBe($ingredientIds);
    expect($darbar->menuItems()->pluck('id')->all())->toBe($originalItems)->and($admin->fresh()->restaurant_id)->toBe($darbar->id);
    expect(User::where('email', 'like', '%@demo.mehfil-kitchen.test')->count())->toBe(20)->and(User::where('email', 'like', '%@demo.juniper-table.test')->count())->toBe(20);
});

test('test restaurant seeder refuses production execution', function () {
    app()->detectEnvironment(fn () => 'production');
    expect(fn () => app(AdditionalRestaurantsSeeder::class)->run())->toThrow(RuntimeException::class, 'disabled in production');
    $this->assertDatabaseCount('restaurants', 0);
});
