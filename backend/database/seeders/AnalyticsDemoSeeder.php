<?php

namespace Database\Seeders;

use App\Models\Feedback;
use App\Models\FeedbackMenuItem;
use App\Models\Ingredient;
use App\Models\LoyaltyTransaction;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\ServiceRequest;
use App\Models\Table;
use App\Models\TableSession;
use App\Models\User;
use App\Services\LoyaltyService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seeds realistic Pakistan-oriented demo data so the admin Analytics
 * dashboard has charts, heatmaps, sentiment, loyalty, and fulfillment metrics.
 *
 * Safe to re-run: removes previous demo customers (@demo.darbar.pk) and
 * regenerates ~60 days of activity for Darbar Restaurant.
 */
class AnalyticsDemoSeeder extends Seeder
{
    private string $demoDomain = 'demo.darbar.pk';

    private int $demoIndex = 0;

    private const LOOKBACK_DAYS = 60;

    /** @var list<array{name: string, email: string, phone: string, city: string}> */
    private array $customers = [
        ['name' => 'Ahmed Khan', 'email' => 'ahmed.khan@demo.darbar.pk', 'phone' => '+923001111001', 'city' => 'Lahore'],
        ['name' => 'Fatima Ali', 'email' => 'fatima.ali@demo.darbar.pk', 'phone' => '+923001111002', 'city' => 'Lahore'],
        ['name' => 'Hassan Raza', 'email' => 'hassan.raza@demo.darbar.pk', 'phone' => '+923001111003', 'city' => 'Islamabad'],
        ['name' => 'Ayesha Malik', 'email' => 'ayesha.malik@demo.darbar.pk', 'phone' => '+923001111004', 'city' => 'Karachi'],
        ['name' => 'Usman Sheikh', 'email' => 'usman.sheikh@demo.darbar.pk', 'phone' => '+923001111005', 'city' => 'Lahore'],
        ['name' => 'Zainab Hussain', 'email' => 'zainab.hussain@demo.darbar.pk', 'phone' => '+923001111006', 'city' => 'Rawalpindi'],
        ['name' => 'Bilal Ahmed', 'email' => 'bilal.ahmed@demo.darbar.pk', 'phone' => '+923001111007', 'city' => 'Faisalabad'],
        ['name' => 'Sana Iqbal', 'email' => 'sana.iqbal@demo.darbar.pk', 'phone' => '+923001111008', 'city' => 'Multan'],
        ['name' => 'Omar Farooq', 'email' => 'omar.farooq@demo.darbar.pk', 'phone' => '+923001111009', 'city' => 'Lahore'],
        ['name' => 'Maryam Siddiqui', 'email' => 'maryam.siddiqui@demo.darbar.pk', 'phone' => '+923001111010', 'city' => 'Karachi'],
        ['name' => 'Hamza Butt', 'email' => 'hamza.butt@demo.darbar.pk', 'phone' => '+923001111011', 'city' => 'Gujranwala'],
        ['name' => 'Hira Nadeem', 'email' => 'hira.nadeem@demo.darbar.pk', 'phone' => '+923001111012', 'city' => 'Lahore'],
        ['name' => 'Saad Qureshi', 'email' => 'saad.qureshi@demo.darbar.pk', 'phone' => '+923001111013', 'city' => 'Islamabad'],
        ['name' => 'Noor Fatima', 'email' => 'noor.fatima@demo.darbar.pk', 'phone' => '+923001111014', 'city' => 'Peshawar'],
        ['name' => 'Ali Haider', 'email' => 'ali.haider@demo.darbar.pk', 'phone' => '+923001111015', 'city' => 'Lahore'],
        ['name' => 'Mehwish Khan', 'email' => 'mehwish.khan@demo.darbar.pk', 'phone' => '+923001111016', 'city' => 'Karachi'],
        ['name' => 'Imran Shah', 'email' => 'imran.shah@demo.darbar.pk', 'phone' => '+923001111017', 'city' => 'Quetta'],
        ['name' => 'Rabia Anwar', 'email' => 'rabia.anwar@demo.darbar.pk', 'phone' => '+923001111018', 'city' => 'Lahore'],
        ['name' => 'Taha Javed', 'email' => 'taha.javed@demo.darbar.pk', 'phone' => '+923001111019', 'city' => 'Sialkot'],
        ['name' => 'Kiran Aziz', 'email' => 'kiran.aziz@demo.darbar.pk', 'phone' => '+923001111020', 'city' => 'Hyderabad'],
    ];

    /** @var list<array{text: string, rating: int, label: string, score: float}> */
    private array $reviews = [
        ['text' => 'Chicken karahi was zabardast! Reminds me of home-style cooking in Lahore.', 'rating' => 5, 'label' => 'positive', 'score' => 0.92],
        ['text' => 'Mutton biryani was aromatic and perfectly spiced. Will definitely come again.', 'rating' => 5, 'label' => 'positive', 'score' => 0.88],
        ['text' => 'Service was a bit slow during iftar rush, but the nihari made up for it.', 'rating' => 4, 'label' => 'positive', 'score' => 0.45],
        ['text' => 'Chapli kebab was authentic Peshawari style. Great with raita.', 'rating' => 5, 'label' => 'positive', 'score' => 0.85],
        ['text' => 'Average experience. Daal makhani was okay but nothing special.', 'rating' => 3, 'label' => 'neutral', 'score' => 0.05],
        ['text' => 'Food was cold when it arrived. Very disappointed with the karahi.', 'rating' => 2, 'label' => 'negative', 'score' => -0.72],
        ['text' => 'Karak chai and gulab jamun — perfect ending to the meal. Mashallah!', 'rating' => 5, 'label' => 'positive', 'score' => 0.9],
        ['text' => 'Waiter was rude and the bill took forever. Food was fine though.', 'rating' => 2, 'label' => 'negative', 'score' => -0.55],
        ['text' => 'Best handi in Gulberg. Portion size is generous for the price.', 'rating' => 5, 'label' => 'positive', 'score' => 0.87],
        ['text' => 'Beef chilli dry was too oily. Expected better for Rs 1250.', 'rating' => 2, 'label' => 'negative', 'score' => -0.48],
        ['text' => 'Family dinner was lovely. Kids loved the mango shake and samosas.', 'rating' => 5, 'label' => 'positive', 'score' => 0.91],
        ['text' => 'Decent place for office lunch. Egg fried rice was quick and tasty.', 'rating' => 4, 'label' => 'positive', 'score' => 0.62],
        ['text' => 'Table was dirty and cutlery was missing. Not impressed.', 'rating' => 1, 'label' => 'negative', 'score' => -0.88],
        ['text' => 'Rasmalai was soft and sweet — just like from a proper mithai shop.', 'rating' => 5, 'label' => 'positive', 'score' => 0.86],
        ['text' => 'Okay overall. Nothing memorable but no complaints either.', 'rating' => 3, 'label' => 'neutral', 'score' => 0.02],
        ['text' => 'The naan was cold and hard. Please improve kitchen timing.', 'rating' => 2, 'label' => 'negative', 'score' => -0.6],
        ['text' => 'Shukriya for the warm hospitality. Mutton pulao was excellent.', 'rating' => 5, 'label' => 'positive', 'score' => 0.89],
        ['text' => 'Sweet lassi was refreshing after the spicy biryani. Perfect combo.', 'rating' => 4, 'label' => 'positive', 'score' => 0.7],
        ['text' => 'Order took almost 45 minutes. Staff seemed understaffed on Friday.', 'rating' => 2, 'label' => 'negative', 'score' => -0.5],
        ['text' => 'Gajar ka Halwa tasted homemade. Will bring my parents next time.', 'rating' => 5, 'label' => 'positive', 'score' => 0.84],
    ];

    public function run(): void
    {
        $restaurant = Restaurant::query()->whereIn('slug', ['darbar', 'darbar-restaurant'])->first()
            ?? Restaurant::query()->where('name', 'Darbar Restaurant')->first();
        if (! $restaurant) {
            $this->command?->error('Darbar not found. Run RestaurantMenuSeeder first.');

            return;
        }
        $this->seedForRestaurant($restaurant);
    }

    public function seedForRestaurant(Restaurant $restaurant, int $demoIndex = 0): void
    {
        $this->demoIndex = $demoIndex;
        $this->demoDomain = $demoIndex === 0 ? 'demo.darbar.pk' : 'demo.'.$restaurant->slug.'.test';
        $tables = Table::query()->where('restaurant_id', $restaurant->id)->get();
        $menuItems = MenuItem::query()->where('restaurant_id', $restaurant->id)->where('is_available', true)->get();

        if ($tables->isEmpty() || $menuItems->isEmpty()) {
            $this->command?->error('Need tables and menu items. Run TablesTableSeeder and RestaurantMenuSeeder first.');

            return;
        }

        $this->command?->info("Seeding analytics demo data for {$restaurant->name}...");

        DB::transaction(function () use ($restaurant, $tables, $menuItems) {
            $this->cleanupPreviousDemo($restaurant->id);

            $users = $this->seedCustomers();
            $loyalty = app(LoyaltyService::class);

            $orderCount = 0;
            $reviewCount = 0;
            $guestOrderCount = 0;

            // ~4–10 orders per day for 60 days with lunch/dinner peaks
            for ($dayOffset = self::LOOKBACK_DAYS; $dayOffset >= 0; $dayOffset--) {
                $date = now()->subDays($dayOffset)->startOfDay();
                $isWeekend = $date->isFriday() || $date->isSaturday() || $date->isSunday();
                $ordersToday = $isWeekend ? random_int(8, 14) : random_int(4, 9);

                for ($i = 0; $i < $ordersToday; $i++) {
                    $isGuest = random_int(1, 100) <= 25;
                    $user = $isGuest ? null : $users->random();
                    $table = $tables->random();

                    // Peak hours: lunch 12–15, dinner 19–22; lighter elsewhere
                    $hourRoll = random_int(1, 100);
                    if ($hourRoll <= 40) {
                        $hour = random_int(12, 15);
                    } elseif ($hourRoll <= 85) {
                        $hour = random_int(19, 22);
                    } else {
                        $hour = random_int(11, 23);
                    }

                    $placedAt = $date->copy()->setTime($hour, random_int(0, 59), random_int(0, 59));
                    if ($placedAt->isFuture()) {
                        continue;
                    }

                    $statusRoll = random_int(1, 100);
                    $status = match (true) {
                        $statusRoll <= 6 => 'cancelled',
                        $statusRoll <= 10 && $dayOffset === 0 => 'preparing',
                        default => 'completed',
                    };

                    $itemCount = random_int(1, 4);
                    $selectedItems = $menuItems->random(min($itemCount, $menuItems->count()));
                    if ($selectedItems instanceof MenuItem) {
                        $selectedItems = collect([$selectedItems]);
                    }

                    $subtotal = 0.0;
                    $lineItems = [];
                    foreach ($selectedItems as $item) {
                        $qty = random_int(1, 3);
                        $lineTotal = (float) $item->base_price * $qty;
                        $subtotal += $lineTotal;
                        $lineItems[] = [
                            'menu_item' => $item,
                            'quantity' => $qty,
                            'unit_price' => (float) $item->base_price,
                            'total_price' => $lineTotal,
                        ];
                    }

                    $tax = round($subtotal * 0.12, 2);
                    $discount = 0.0;
                    if ($user && $status === 'completed' && $subtotal >= 1000) {
                        $discountInfo = $loyalty->discountFor($user, $subtotal);
                        $discount = $discountInfo['amount'];
                    }
                    $total = round($subtotal - $discount + $tax, 2);

                    $session = TableSession::create([
                        'table_id' => $table->id,
                        'restaurant_id' => $restaurant->id,
                        'session_token' => Str::random(40),
                        'started_at' => $placedAt->copy()->subMinutes(random_int(5, 20)),
                        'ended_at' => $status !== 'preparing'
                            ? $placedAt->copy()->addMinutes(random_int(45, 110))
                            : null,
                        'total_amount' => $status === 'completed' ? $total : 0,
                        'status' => $status !== 'preparing' ? 'completed' : 'active',
                        'payment_status' => $status === 'completed' ? 'paid' : 'unpaid',
                    ]);

                    $confirmedAt = $status !== 'cancelled'
                        ? $placedAt->copy()->addMinutes(random_int(1, 6))
                        : null;
                    $readyAt = in_array($status, ['completed', 'preparing'], true) && $confirmedAt
                        ? $confirmedAt->copy()->addMinutes(random_int(12, 35))
                        : null;
                    $completedAt = $status === 'completed' && $readyAt
                        ? $readyAt->copy()->addMinutes(random_int(3, 15))
                        : null;

                    if ($status === 'preparing') {
                        $readyAt = null;
                        $completedAt = null;
                    }

                    $order = Order::create([
                        'restaurant_id' => $restaurant->id,
                        'table_id' => $table->id,
                        'session_id' => $session->id,
                        'user_id' => $user?->id,
                        'order_number' => 'ORD-DEMO-'.strtoupper(Str::random(8)),
                        'order_type' => 'dine_in',
                        'subtotal' => $subtotal,
                        'tax_amount' => $tax,
                        'discount_amount' => $discount,
                        'total_amount' => $total,
                        'status' => $status,
                        'special_instructions' => random_int(1, 10) === 1 ? 'Kam mirch, please' : null,
                        'placed_at' => $placedAt,
                        'confirmed_at' => $confirmedAt,
                        'ready_at' => $status === 'completed' ? $readyAt : ($status === 'preparing' ? null : $readyAt),
                        'completed_at' => $completedAt,
                    ]);

                    foreach ($lineItems as $line) {
                        OrderItem::create([
                            'order_id' => $order->id,
                            'menu_item_id' => $line['menu_item']->id,
                            'quantity' => $line['quantity'],
                            'unit_price' => $line['unit_price'],
                            'total_price' => $line['total_price'],
                        ]);

                        MenuItem::where('id', $line['menu_item']->id)->increment('total_orders', $line['quantity']);
                    }

                    if ($status === 'completed') {
                        Payment::create([
                            'order_id' => $order->id,
                            'session_id' => $session->id,
                            'user_id' => $user?->id,
                            'payment_method' => collect(['cash', 'safepay'])->random(),
                            'payment_type' => 'full',
                            'amount' => $total,
                            'transaction_id' => 'TXN-DEMO-'.strtoupper(Str::random(10)),
                            'status' => 'completed',
                            'paid_at' => $completedAt ?? $placedAt->copy()->addMinutes(40),
                        ]);

                        if ($user) {
                            $loyalty->awardPoints($order->fresh());
                        }

                        // ~55% of completed orders get a review
                        if (random_int(1, 100) <= 55) {
                            $review = $this->reviews[array_rand($this->reviews)];
                            $shouldFlag = $review['label'] === 'negative' && $review['rating'] <= 2;
                            $responded = random_int(1, 100) <= 40;

                            $reviewedAt = ($completedAt ?? $placedAt)->copy()->addMinutes(random_int(10, 90));
                            $feedback = Feedback::create([
                                'restaurant_id' => $restaurant->id,
                                'order_id' => $order->id,
                                'user_id' => $user?->id,
                                'rating' => $review['rating'],
                                'review_text' => $review['text'],
                                'sentiment_score' => $review['score'],
                                'sentiment_label' => $review['label'],
                                'sentiment_confidence' => round(random_int(70, 95) / 100, 4),
                                'is_flagged' => $shouldFlag,
                                'flagged_reason' => $shouldFlag ? 'Highly negative feedback with low rating' : null,
                                'admin_response' => $responded
                                    ? 'Thank you for your feedback. We appreciate you dining with us at '.$restaurant->name.'.'
                                    : null,
                                'responded_at' => $responded ? $reviewedAt->copy()->addHours(random_int(2, 48)) : null,
                            ]);
                            $feedback->forceFill([
                                'created_at' => $reviewedAt,
                                'updated_at' => $reviewedAt,
                            ])->save();

                            $reviewedItem = $lineItems[array_rand($lineItems)]['menu_item'];
                            FeedbackMenuItem::create([
                                'feedback_id' => $feedback->id,
                                'menu_item_id' => $reviewedItem->id,
                                'item_rating' => $review['rating'],
                                'item_review_text' => $review['text'],
                                'item_sentiment_score' => $review['score'],
                                'item_sentiment_label' => $review['label'],
                                'item_is_flagged' => $shouldFlag,
                            ]);

                            $reviewCount++;
                        }
                    }

                    $orderCount++;
                    if ($isGuest) {
                        $guestOrderCount++;
                    }
                }
            }

            // Keep denormalized menu item ratings in sync with seeded reviews
            foreach ($menuItems as $menuItem) {
                $menuItem->recalculateAverageRating();
                $menuItem->update(['total_orders' => $menuItem->orderItems()->sum('quantity')]);
            }

            // Sync loyalty tiers from awarded points
            foreach ($users as $user) {
                $user->refresh();
                $user->loyalty_tier = $loyalty->tierForPoints((int) $user->loyalty_points);
                $user->save();
            }

            // Simulate some redemptions for gold/silver customers
            $redeemable = $users->filter(fn (User $u) => $u->loyalty_points >= 200)->take(5);
            foreach ($redeemable as $user) {
                $points = -min(100, (int) floor($user->loyalty_points / 4));
                $user->loyalty_points = max(0, (int) $user->loyalty_points + $points);
                $user->loyalty_tier = $loyalty->tierForPoints((int) $user->loyalty_points);
                $user->save();

                $txn = LoyaltyTransaction::create([
                    'user_id' => $user->id,
                    'order_id' => $user->orders()->where('restaurant_id', $restaurant->id)->where('status', 'completed')->value('id'),
                    'transaction_type' => 'redeemed',
                    'points' => $points,
                    'balance_after' => (int) $user->loyalty_points,
                    'description' => 'Redeemed for complimentary dessert',
                ]);
                $txn->forceFill([
                    'created_at' => now()->subDays(random_int(1, 20)),
                ])->save();
            }

            // Churn-risk customers: ordered earlier, not recently
            $churnUsers = $users->take(4);
            foreach ($churnUsers as $index => $user) {
                // Ensure they have older completed orders only by leaving as-is;
                // create an extra old order if they somehow only have recent ones
                $hasRecent = Order::query()
                    ->where('user_id', $user->id)
                    ->where('restaurant_id', $restaurant->id)
                    ->where('status', 'completed')
                    ->where('placed_at', '>=', now()->subDays(45))
                    ->exists();

                if ($hasRecent && $index < 3) {
                    Order::query()
                        ->where('user_id', $user->id)
                        ->where('restaurant_id', $restaurant->id)
                        ->where('status', 'completed')
                        ->where('placed_at', '>=', now()->subDays(45))
                        ->update(['placed_at' => now()->subDays(random_int(50, 58))]);
                }
            }

            $this->seedReservations($restaurant->id);
            $this->seedServiceRequests($restaurant->id, $tables);
            $this->seedLowStockIngredients($restaurant->id);

            $this->command?->info("Created {$orderCount} orders ({$guestOrderCount} guest), {$reviewCount} reviews, {$users->count()} customers.");
        });

        $this->command?->info('Analytics demo seeding complete for '.$restaurant->name.'.');
    }

    private function cleanupPreviousDemo(int $restaurantId): void
    {
        $demoUserIds = User::query()
            ->where('email', 'like', '%@'.$this->demoDomain)
            ->pluck('id');

        $demoOrderIds = Order::query()
            ->where('restaurant_id', $restaurantId)
            ->where(function ($q) use ($demoUserIds) {
                $q->whereIn('user_id', $demoUserIds)
                    ->orWhere('order_number', 'like', 'ORD-DEMO-%');
            })
            ->pluck('id');

        $sessionIds = Order::query()
            ->whereIn('id', $demoOrderIds)
            ->whereNotNull('session_id')
            ->pluck('session_id');

        FeedbackMenuItem::query()
            ->whereIn('feedback_id', Feedback::query()->whereIn('order_id', $demoOrderIds)->select('id'))
            ->delete();

        Feedback::query()->whereIn('order_id', $demoOrderIds)->delete();
        Payment::query()->whereIn('order_id', $demoOrderIds)->delete();
        LoyaltyTransaction::query()->whereIn('order_id', $demoOrderIds)->delete();
        LoyaltyTransaction::query()->whereIn('user_id', $demoUserIds)->whereNull('order_id')->delete();
        OrderItem::query()->whereIn('order_id', $demoOrderIds)->delete();
        Order::query()->whereIn('id', $demoOrderIds)->delete();
        TableSession::query()->whereIn('id', $sessionIds)->delete();

        Reservation::query()
            ->where('restaurant_id', $restaurantId)
            ->where('guest_email', 'like', '%@'.$this->demoDomain)
            ->delete();

        ServiceRequest::query()
            ->where('restaurant_id', $restaurantId)
            ->where('message', 'like', '[DEMO]%')
            ->delete();

        User::query()->whereIn('id', $demoUserIds)->whereDoesntHave('orders')->delete();
    }

    /** @return \Illuminate\Support\Collection<int, User> */
    private function seedCustomers()
    {
        $loyalty = app(LoyaltyService::class);
        $users = collect();

        foreach ($this->customers as $index => $row) {
            // Spread points so we get bronze / silver / gold distribution
            $points = match (true) {
                $index < 8 => random_int(0, 450),
                $index < 15 => random_int(500, 1400),
                default => random_int(1500, 3200),
            };

            $email = explode('@', $row['email'])[0].'@'.$this->demoDomain;
            $phone = $this->demoIndex === 0 ? $row['phone'] : '+923'.(50 + $this->demoIndex).str_pad((string) ($index + 1), 7, '0', STR_PAD_LEFT);
            $user = User::firstOrCreate(['email' => $email], [
                'name' => $row['name'],
                'phone' => $phone,
                'password' => 'password',
                'role' => 'customer',
                'loyalty_points' => $points,
                'loyalty_tier' => $loyalty->tierForPoints($points),
                'is_active' => true,
            ]);
            $user->forceFill([
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
            ])->save();

            $users->push($user);
        }

        return $users;
    }

    private function seedReservations(int $restaurantId): void
    {
        $guests = [
            ['name' => 'Asad Mehmood', 'phone' => '+923212220001', 'email' => 'asad.mehmood@demo.darbar.pk'],
            ['name' => 'Saba Rehman', 'phone' => '+923212220002', 'email' => 'saba.rehman@demo.darbar.pk'],
            ['name' => 'Naveed Akhtar', 'phone' => '+923212220003', 'email' => 'naveed.akhtar@demo.darbar.pk'],
            ['name' => 'Hina Shahid', 'phone' => '+923212220004', 'email' => 'hina.shahid@demo.darbar.pk'],
            ['name' => 'Faisal Mir', 'phone' => '+923212220005', 'email' => 'faisal.mir@demo.darbar.pk'],
            ['name' => 'Amna Tariq', 'phone' => '+923212220006', 'email' => 'amna.tariq@demo.darbar.pk'],
        ];

        foreach ($guests as $i => $guest) {
            Reservation::create([
                'restaurant_id' => $restaurantId,
                'user_id' => null,
                'guest_name' => $guest['name'],
                'guest_phone' => $guest['phone'],
                'guest_email' => explode('@', $guest['email'])[0].'@'.$this->demoDomain,
                'party_size' => random_int(2, 6),
                'reservation_date' => now()->addDays($i + 1)->toDateString(),
                'reservation_time' => collect(['19:00:00', '20:00:00', '20:30:00', '21:00:00'])->random(),
                'status' => $i < 3 ? 'pending' : 'confirmed',
                'special_requests' => $i === 0 ? 'Window seat preferred, shukriya' : null,
                'confirmation_code' => strtoupper(Str::random(8)),
            ]);
        }
    }

    private function seedServiceRequests(int $restaurantId, $tables): void
    {
        $types = ['waiter_call', 'extra_naan_roti', 'extra_raita_salad', 'water_refill', 'cutlery', 'bill_request', 'complaint'];

        for ($i = 0; $i < 8; $i++) {
            ServiceRequest::create([
                'restaurant_id' => $restaurantId,
                'table_id' => $tables->random()->id,
                'request_type' => $types[array_rand($types)],
                'priority' => collect(['low', 'medium', 'high'])->random(),
                'message' => '[DEMO] Extra naan and water for the table, please.',
                'status' => $i < 3 ? 'pending' : ($i < 5 ? 'acknowledged' : 'resolved'),
                'created_at' => now()->subHours(random_int(1, 48)),
                'acknowledged_at' => $i >= 3 ? now()->subHours(random_int(1, 24)) : null,
                'resolved_at' => $i >= 5 ? now()->subHours(random_int(1, 12)) : null,
            ]);
        }
    }

    private function seedLowStockIngredients(int $restaurantId): void
    {
        Ingredient::query()
            ->where('restaurant_id', $restaurantId)
            ->whereIn('name', ['Mutton', 'Paneer', 'Tea Leaves'])
            ->update([
                'stock_quantity' => 5,
                'minimum_threshold' => 10,
            ]);
    }
}
