<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DemandForecast;
use App\Models\Ingredient;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\QueueEntry;
use App\Models\Restaurant;
use App\Models\SessionParticipant;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdditionalRestaurantsSeeder extends Seeder
{
    public const RESTAURANTS = [
        ['name' => 'Mehfil Kitchen', 'slug' => 'mehfil-kitchen', 'city' => 'Islamabad', 'items' => 18, 'tables' => 6],
        ['name' => 'Juniper Table', 'slug' => 'juniper-table', 'city' => 'Karachi', 'items' => 14, 'tables' => 5],
        ['name' => 'Zaiqa House', 'slug' => 'zaiqa-house', 'city' => 'Rawalpindi', 'items' => 24, 'tables' => 8],
        ['name' => 'Saffron Courtyard', 'slug' => 'saffron-courtyard', 'city' => 'Lahore', 'items' => 20, 'tables' => 7],
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            throw new \RuntimeException('Test restaurant seeding is disabled in production.');
        }
        $source = Restaurant::query()->whereIn('slug', ['darbar', 'darbar-restaurant'])->first()
            ?? Restaurant::query()->where('name', 'Darbar Restaurant')->first();
        if (! $source || ! $source->menuItems()->exists()) {
            throw new \RuntimeException('Seed Darbar and its menu before adding test restaurants.');
        }
        foreach (self::RESTAURANTS as $index => $definition) {
            DB::transaction(function () use ($source, $definition, $index) {
                $restaurant = Restaurant::firstOrCreate(['slug' => $definition['slug']], [
                    'name' => $definition['name'], 'address' => 'Test restaurant, '.$definition['city'].', Pakistan',
                    'phone' => '+923'.(60 + $index).'00000001', 'email' => 'hello@'.$definition['slug'].'.test',
                    'opening_time' => '11:00:00', 'closing_time' => '23:00:00', 'timezone' => 'Asia/Karachi', 'is_active' => true,
                ]);
                $ingredientMap = [];
                foreach ($source->ingredients as $ingredient) {
                    $copy = Ingredient::firstOrCreate(['restaurant_id' => $restaurant->id, 'name' => $ingredient->name],
                        $ingredient->only(['unit', 'cost_per_unit', 'stock_quantity', 'minimum_threshold', 'is_allergen', 'allergen_type']));
                    $ingredientMap[$ingredient->id] = $copy->id;
                }
                $items = $source->menuItems()->with(['category', 'ingredients'])->get()
                    ->sortBy(fn ($item) => hash('sha256', $definition['slug'].':'.$item->slug))
                    ->take(min($definition['items'], max(1, $source->menuItems()->count() - 1)));
                $categoryMap = [];
                foreach ($items as $position => $item) {
                    if (! isset($categoryMap[$item->category_id])) {
                        $categoryMap[$item->category_id] = Category::firstOrCreate([
                            'restaurant_id' => $restaurant->id, 'slug' => $item->category->slug,
                        ], [...$item->category->only(['name', 'description', 'is_active']), 'display_order' => count($categoryMap) + 1])->id;
                    }
                    $copy = MenuItem::firstOrCreate(['restaurant_id' => $restaurant->id, 'slug' => $item->slug], [
                        ...$item->only(['name', 'description', 'base_price', 'preparation_time', 'spice_level', 'cuisine_type', 'calories', 'is_vegetarian', 'is_vegan', 'is_gluten_free', 'is_available', 'is_signature', 'image_url', 'ar_model_url', 'popularity_score']),
                        'category_id' => $categoryMap[$item->category_id],
                    ]);
                    if ($copy->wasRecentlyCreated) {
                        foreach ($item->ingredients as $ingredient) {
                            $copy->ingredients()->attach($ingredientMap[$ingredient->id], $ingredient->pivot->only([
                                'quantity', 'is_optional', 'is_removable', 'is_adjustable', 'min_quantity', 'max_quantity', 'extra_unit_price', 'additional_price',
                            ]));
                        }
                    }
                }
                for ($number = 1; $number <= $definition['tables']; $number++) {
                    Table::firstOrCreate(['restaurant_id' => $restaurant->id, 'table_number' => (string) $number], [
                        'qr_code' => (string) Str::uuid(), 'capacity' => $number % 3 === 0 ? 6 : 4, 'status' => 'available',
                    ]);
                }
                foreach (['admin', 'staff'] as $role) {
                    $user = User::firstOrCreate(['email' => $role.'@'.$definition['slug'].'.test'], [
                        'name' => $definition['name'].' '.ucfirst($role), 'phone' => '+923'.(60 + $index).'0000000'.($role === 'admin' ? '2' : '3'),
                        'password' => $role === 'admin' ? 'RestaurantDemo!2026' : 'StaffDemo!2026',
                        'role' => $role, 'restaurant_id' => $restaurant->id, 'is_active' => true,
                    ]);
                    if ($user->restaurant_id !== $restaurant->id || $user->role !== $role) {
                        throw new \RuntimeException('A demo login is already used by another account.');
                    }
                    if ($user->wasRecentlyCreated) {
                        $user->forceFill(['email_verified_at' => now()])->save();
                    }
                }
                $analytics = app(AnalyticsDemoSeeder::class);
                if ($this->command) {
                    $analytics->setCommand($this->command);
                }
                $analytics->seedForRestaurant($restaurant, $index + 1);
                $this->seedForecasts($restaurant, $index);
                $this->seedLiveService($restaurant);
                for ($q = 1; $q <= 3; $q++) {
                    QueueEntry::firstOrCreate(['restaurant_id' => $restaurant->id, 'guest_phone' => '+923'.(70 + $index).'0000000'.$q], [
                        'queue_number' => $q, 'guest_name' => 'Demo guest '.$q, 'party_size' => $q + 1,
                        'status' => 'waiting', 'estimated_wait_time' => $q * 10, 'joined_at' => now()->subMinutes($q * 5),
                    ]);
                }
                $this->command?->info($restaurant->name.': '.$restaurant->menuItems()->count().' dishes, '.$restaurant->orders()->count().' orders; admin@'.$definition['slug'].'.test');
            });
        }
    }

    public function seedLiveService(Restaurant $restaurant): void
    {
        $items = $restaurant->menuItems()->orderBy('id')->take(2)->get();
        foreach ($restaurant->tables()->orderBy('id')->take(2)->get() as $index => $table) {
            $number = 'ORD-DEMO-LIVE-'.$restaurant->id.'-'.$index;
            if (Order::where('order_number', $number)->exists() || ($table->current_session_id && $table->currentSession)) {
                continue;
            }
            $item = $items[$index % $items->count()];
            $total = round((float) $item->base_price * 1.12, 2);
            $paid = $index === 0;
            $session = TableSession::create([
                'restaurant_id' => $restaurant->id, 'table_id' => $table->id, 'session_token' => Str::random(40),
                'started_at' => now()->subMinutes(10), 'status' => $paid ? 'active' : 'checkout_pending',
                'total_amount' => $total, 'payment_status' => $paid ? 'paid' : 'unpaid',
            ]);
            $participant = SessionParticipant::create([
                'session_id' => $session->id, 'device_id' => 'demo-'.$restaurant->id.'-'.$index,
                'is_host' => true, 'joined_at' => now()->subMinutes(10),
            ]);
            $order = Order::create([
                'restaurant_id' => $restaurant->id, 'table_id' => $table->id, 'session_id' => $session->id,
                'order_number' => $number, 'order_type' => 'dine_in', 'subtotal' => $item->base_price,
                'tax_amount' => round((float) $item->base_price * .12, 2), 'total_amount' => $total,
                'status' => $paid ? 'preparing' : 'pending_payment', 'placed_at' => now()->subMinutes(8),
                'confirmed_at' => $paid ? now()->subMinutes(7) : null,
            ]);
            OrderItem::create(['order_id' => $order->id, 'menu_item_id' => $item->id, 'quantity' => 1, 'unit_price' => $item->base_price, 'total_price' => $item->base_price]);
            Payment::create([
                'order_id' => $order->id, 'session_id' => $session->id, 'participant_id' => $participant->id,
                'amount' => $total, 'payment_method' => 'cash', 'payment_type' => 'full',
                'status' => $paid ? 'completed' : 'pending', 'paid_at' => $paid ? now()->subMinutes(7) : null,
                'transaction_id' => 'TXN-DEMO-LIVE-'.$restaurant->id.'-'.$index,
            ]);
            $table->update(['current_session_id' => $session->id, 'status' => 'occupied']);
            $item->update(['total_orders' => $item->orderItems()->sum('quantity')]);
        }
    }

    private function seedForecasts(Restaurant $restaurant, int $index): void
    {
        foreach ($restaurant->menuItems()->orderBy('id')->get() as $item) {
            $dailyAverage = (int) ceil($item->orderItems()->sum('quantity') / 60);
            foreach ([today(), today()->addDay()] as $date) {
                foreach (range(11, 22) as $hour) {
                    DemandForecast::query()->whereDate('forecast_date', $date->toDateString())->updateOrCreate([
                        'restaurant_id' => $restaurant->id, 'menu_item_id' => $item->id,
                        'hour_of_day' => $hour,
                    ], ['forecast_date' => $date->toDateString(), 'predicted_quantity' => max(1, (int) ceil($dailyAverage / (in_array($hour, [13, 14, 19, 20, 21]) ? 4 : 8))), 'confidence_score' => 0.7 + $index * 0.03]);
                }
            }
        }
    }
}
