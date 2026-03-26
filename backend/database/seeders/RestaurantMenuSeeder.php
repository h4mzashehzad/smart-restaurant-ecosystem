<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RestaurantMenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Restaurant
        $restaurantId = DB::table('restaurants')->insertGetId([
            'name' => 'The Lahore Karahi',
            'slug' => Str::slug('The Lahore Karahi'),
            'address' => '123 Food Street, Gulberg, Lahore, Pakistan',
            'phone' => '+923001234567',
            'email' => 'info@lahorekarahi.pk',
            'opening_time' => '11:00:00',
            'closing_time' => '23:59:00',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Create Categories
        $categories = [
            ['name' => 'Starters', 'slug' => 'starters', 'description' => 'Appetizers to start your meal.', 'display_order' => 1],
            ['name' => 'Main Course', 'slug' => 'main-course', 'description' => 'Delicious mains.', 'display_order' => 2],
            ['name' => 'Desserts', 'slug' => 'desserts', 'description' => 'Sweet treats.', 'display_order' => 3],
            ['name' => 'Beverages', 'slug' => 'beverages', 'description' => 'Refreshing drinks.', 'display_order' => 4],
        ];

        $categoryIds = [];
        foreach ($categories as $cat) {
            $cat['restaurant_id'] = $restaurantId;
            $cat['created_at'] = now();
            $cat['updated_at'] = now();
            $categoryIds[$cat['name']] = DB::table('categories')->insertGetId($cat);
        }

        // 3. Create Ingredients
        $ingredientsData = [
            ['name' => 'Chicken', 'unit' => 'kg', 'cost_per_unit' => 600.00],
            ['name' => 'Mutton', 'unit' => 'kg', 'cost_per_unit' => 1800.00],
            ['name' => 'Beef', 'unit' => 'kg', 'cost_per_unit' => 1200.00],
            ['name' => 'Tomato', 'unit' => 'kg', 'cost_per_unit' => 150.00],
            ['name' => 'Onion', 'unit' => 'kg', 'cost_per_unit' => 100.00],
            ['name' => 'Yogurt', 'unit' => 'kg', 'cost_per_unit' => 200.00, 'is_allergen' => true, 'allergen_type' => 'Dairy'],
            ['name' => 'Flour', 'unit' => 'kg', 'cost_per_unit' => 120.00, 'is_allergen' => true, 'allergen_type' => 'Gluten'],
            ['name' => 'Sugar', 'unit' => 'kg', 'cost_per_unit' => 140.00],
            ['name' => 'Milk', 'unit' => 'liter', 'cost_per_unit' => 220.00, 'is_allergen' => true, 'allergen_type' => 'Dairy'],
            ['name' => 'Cooking Oil', 'unit' => 'liter', 'cost_per_unit' => 500.00],
            ['name' => 'Rice', 'unit' => 'kg', 'cost_per_unit' => 300.00],
            ['name' => 'Tea Leaves', 'unit' => 'kg', 'cost_per_unit' => 1200.00],
        ];

        $ingredientIds = [];
        foreach ($ingredientsData as $ing) {
            $ing['restaurant_id'] = $restaurantId;
            $ing['stock_quantity'] = 50.00;
            $ing['minimum_threshold'] = 10.00;
            $ing['created_at'] = now();
            $ing['updated_at'] = now();
            if (!isset($ing['is_allergen'])) $ing['is_allergen'] = false;
            $ingredientIds[$ing['name']] = DB::table('ingredients')->insertGetId($ing);
        }

        // 4. Create Menu Items
        $menuItemsData = [
            // Starters
            [
                'category' => 'Starters',
                'name' => 'Chicken Samosa',
                'description' => 'Crispy pastry filled with spiced minced chicken.',
                'base_price' => 150.00,
                'preparation_time' => 10,
                'spice_level' => 'mild',
                'cuisine_type' => 'Pakistani',
                'is_vegetarian' => false,
                'popularity_score' => 4.5,
                'image_url' => 'https://picsum.photos/seed/chicken_samosa/800/600',
                'ingredients' => ['Chicken' => 0.05, 'Flour' => 0.05, 'Cooking Oil' => 0.02]
            ],
            [
                'category' => 'Starters',
                'name' => 'Aloo Tikki',
                'description' => 'Spiced potato patties served with chutney.',
                'base_price' => 100.00,
                'preparation_time' => 10,
                'spice_level' => 'medium',
                'cuisine_type' => 'Pakistani',
                'is_vegetarian' => true,
                'popularity_score' => 4.2,
                'image_url' => 'https://picsum.photos/seed/aloo_tikki/800/600',
                'ingredients' => ['Cooking Oil' => 0.02]
            ],
            // Main Course
            [
                'category' => 'Main Course',
                'name' => 'Chicken Karahi',
                'description' => 'Traditional chicken cooked in a wok with tomatoes, green chillies, and spices.',
                'base_price' => 1400.00,
                'preparation_time' => 25,
                'spice_level' => 'medium',
                'cuisine_type' => 'Pakistani',
                'is_signature' => true,
                'popularity_score' => 4.9,
                'image_url' => 'https://picsum.photos/seed/chicken_karahi/800/600',
                'ingredients' => ['Chicken' => 0.5, 'Tomato' => 0.2, 'Cooking Oil' => 0.1, 'Yogurt' => 0.1]
            ],
            [
                'category' => 'Main Course',
                'name' => 'Mutton Biryani',
                'description' => 'Fragrant basmati rice cooked with tender mutton and aromatic spices.',
                'base_price' => 1600.00,
                'preparation_time' => 30,
                'spice_level' => 'medium',
                'cuisine_type' => 'Pakistani',
                'is_signature' => true,
                'popularity_score' => 4.8,
                'image_url' => 'https://picsum.photos/seed/mutton_biryani/800/600',
                'ingredients' => ['Mutton' => 0.4, 'Rice' => 0.3, 'Onion' => 0.1, 'Yogurt' => 0.1, 'Cooking Oil' => 0.05]
            ],
            [
                'category' => 'Main Course',
                'name' => 'Beef Nihari',
                'description' => 'Slow-cooked beef stew, garnished with ginger and chillies.',
                'base_price' => 1300.00,
                'preparation_time' => 240, // Needs overnight prep/slow cooking but generally served fresh
                'spice_level' => 'hot',
                'cuisine_type' => 'Pakistani',
                'is_signature' => true,
                'popularity_score' => 4.7,
                'image_url' => 'https://picsum.photos/seed/beef_nihari/800/600',
                'ingredients' => ['Beef' => 0.4, 'Flour' => 0.05, 'Cooking Oil' => 0.1]
            ],
            // Desserts
            [
                'category' => 'Desserts',
                'name' => 'Gulab Jamun',
                'description' => 'Deep-fried milk spheres soaked in rose-flavored sugar syrup.',
                'base_price' => 350.00,
                'preparation_time' => 5,
                'spice_level' => 'none',
                'cuisine_type' => 'Pakistani',
                'is_vegetarian' => true,
                'popularity_score' => 4.6,
                'image_url' => 'https://picsum.photos/seed/gulab_jamun/800/600',
                'ingredients' => ['Milk' => 0.2, 'Sugar' => 0.1, 'Flour' => 0.05, 'Cooking Oil' => 0.1]
            ],
            [
                'category' => 'Desserts',
                'name' => 'Kheer',
                'description' => 'Traditional rice pudding cooked with milk, sugar, and nuts.',
                'base_price' => 400.00,
                'preparation_time' => 15, // Pre-prepared
                'spice_level' => 'none',
                'cuisine_type' => 'Pakistani',
                'is_vegetarian' => true,
                'popularity_score' => 4.5,
                'image_url' => 'https://picsum.photos/seed/kheer/800/600',
                'ingredients' => ['Milk' => 0.3, 'Rice' => 0.1, 'Sugar' => 0.05]
            ],
            // Beverages
            [
                'category' => 'Beverages',
                'name' => 'Sweet Lassi',
                'description' => 'Refreshing and thick sweet yogurt-based drink.',
                'base_price' => 250.00,
                'preparation_time' => 5,
                'spice_level' => 'none',
                'cuisine_type' => 'Pakistani',
                'is_vegetarian' => true,
                'popularity_score' => 4.7,
                'image_url' => 'https://picsum.photos/seed/sweet_lassi/800/600',
                'ingredients' => ['Yogurt' => 0.2, 'Milk' => 0.1, 'Sugar' => 0.05]
            ],
            [
                'category' => 'Beverages',
                'name' => 'Karak Chai',
                'description' => 'Strong milk tea brewed to perfection.',
                'base_price' => 150.00,
                'preparation_time' => 5,
                'spice_level' => 'none',
                'cuisine_type' => 'Pakistani',
                'is_vegetarian' => true,
                'popularity_score' => 4.8,
                'image_url' => 'https://picsum.photos/seed/karak_chai/800/600',
                'ingredients' => ['Milk' => 0.1, 'Tea Leaves' => 0.02, 'Sugar' => 0.02]
            ]
        ];

        foreach ($menuItemsData as $itemData) {
            $requiredIngredients = $itemData['ingredients'];
            unset($itemData['ingredients']);
            
            $itemData['restaurant_id'] = $restaurantId;
            $itemData['category_id'] = $categoryIds[$itemData['category']];
            unset($itemData['category']);
            
            $itemData['slug'] = Str::slug($itemData['name']);
            $itemData['created_at'] = now();
            $itemData['updated_at'] = now();
            
            $menuItemId = DB::table('menu_items')->insertGetId($itemData);

            // 5. Link Ingredients to Menu Items
            foreach ($requiredIngredients as $ingName => $quantity) {
                DB::table('menu_item_ingredients')->insert([
                    'menu_item_id' => $menuItemId,
                    'ingredient_id' => $ingredientIds[$ingName],
                    'quantity' => $quantity, // In the units defined by ingredient
                    'is_optional' => false,
                    'is_removable' => true,
                    'additional_price' => 0.00,
                ]);
            }
        }
    }
}
