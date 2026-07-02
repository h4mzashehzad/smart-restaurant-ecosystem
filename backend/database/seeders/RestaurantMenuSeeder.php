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
            'name' => 'Darbar Restaurant',
            'slug' => Str::slug('Darbar Restaurant'),
            'address' => '123 Food Street, Gulberg, Lahore, Pakistan',
            'phone' => '+923001234567',
            'email' => 'info@darbar.pk',
            'opening_time' => '11:00:00',
            'closing_time' => '23:59:00',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Create Categories
        $categories = [
            ['name' => 'Appetizers', 'slug' => 'appetizers', 'description' => 'Appetizers to start your meal.', 'display_order' => 1],
            ['name' => 'Main Course', 'slug' => 'main-course', 'description' => 'Delicious mains.', 'display_order' => 2],
            ['name' => 'Pakistani Cuisine', 'slug' => 'pakistani-cuisine', 'description' => 'Authentic local dishes.', 'display_order' => 3],
            ['name' => 'Asian Cuisine', 'slug' => 'asian-cuisine', 'description' => 'Pan Asian favorites.', 'display_order' => 4],
            ['name' => 'Desserts', 'slug' => 'desserts', 'description' => 'Sweet treats.', 'display_order' => 5],
            ['name' => 'Beverages', 'slug' => 'beverages', 'description' => 'Refreshing drinks.', 'display_order' => 6],
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
            ['name' => 'Fish', 'unit' => 'kg', 'cost_per_unit' => 1500.00],
            ['name' => 'Tomato', 'unit' => 'kg', 'cost_per_unit' => 150.00],
            ['name' => 'Onion', 'unit' => 'kg', 'cost_per_unit' => 100.00],
            ['name' => 'Potato', 'unit' => 'kg', 'cost_per_unit' => 80.00],
            ['name' => 'Yogurt', 'unit' => 'kg', 'cost_per_unit' => 200.00, 'is_allergen' => true, 'allergen_type' => 'Dairy'],
            ['name' => 'Paneer', 'unit' => 'kg', 'cost_per_unit' => 800.00, 'is_allergen' => true, 'allergen_type' => 'Dairy'],
            ['name' => 'Flour', 'unit' => 'kg', 'cost_per_unit' => 120.00, 'is_allergen' => true, 'allergen_type' => 'Gluten'],
            ['name' => 'Sugar', 'unit' => 'kg', 'cost_per_unit' => 140.00],
            ['name' => 'Milk', 'unit' => 'liter', 'cost_per_unit' => 220.00, 'is_allergen' => true, 'allergen_type' => 'Dairy'],
            ['name' => 'Cooking Oil', 'unit' => 'liter', 'cost_per_unit' => 500.00],
            ['name' => 'Rice', 'unit' => 'kg', 'cost_per_unit' => 300.00],
            ['name' => 'Noodles', 'unit' => 'kg', 'cost_per_unit' => 250.00, 'is_allergen' => true, 'allergen_type' => 'Gluten'],
            ['name' => 'Soy Sauce', 'unit' => 'liter', 'cost_per_unit' => 400.00, 'is_allergen' => true, 'allergen_type' => 'Soy'],
            ['name' => 'Tea Leaves', 'unit' => 'kg', 'cost_per_unit' => 1200.00],
            ['name' => 'Coffee Beans', 'unit' => 'kg', 'cost_per_unit' => 2000.00],
            ['name' => 'Lentils', 'unit' => 'kg', 'cost_per_unit' => 350.00],
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
            // --- Appetizers (7 items) ---
            ['category' => 'Appetizers', 'name' => 'Chicken Samosa', 'description' => 'Crispy pastry filled with spiced minced chicken.', 'base_price' => 150.00, 'preparation_time' => 10, 'spice_level' => 'mild', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => false, 'popularity_score' => 4.5, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chicken-samosa.jpg', 'ingredients' => ['Chicken' => 0.05, 'Flour' => 0.05, 'Cooking Oil' => 0.02]],
            ['category' => 'Appetizers', 'name' => 'Aloo Tikki', 'description' => 'Spiced potato patties served with chutney.', 'base_price' => 100.00, 'preparation_time' => 10, 'spice_level' => 'medium', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.2, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/aloo-tikki.jpg', 'ingredients' => ['Potato' => 0.1, 'Cooking Oil' => 0.02]],
            ['category' => 'Appetizers', 'name' => 'Dynamite Prawns', 'description' => 'Crispy fried prawns tossed in spicy mayo.', 'base_price' => 850.00, 'preparation_time' => 15, 'spice_level' => 'hot', 'cuisine_type' => 'Asian', 'is_vegetarian' => false, 'popularity_score' => 4.8, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/dynamite-prawns.jpg', 'ingredients' => ['Fish' => 0.1, 'Flour' => 0.02, 'Cooking Oil' => 0.05]],
            ['category' => 'Appetizers', 'name' => 'Spring Rolls', 'description' => 'Crispy vegetable rolls served with sweet chili sauce.', 'base_price' => 350.00, 'preparation_time' => 12, 'spice_level' => 'mild', 'cuisine_type' => 'Asian', 'is_vegetarian' => true, 'popularity_score' => 4.3, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/spring-rolls.jpg', 'ingredients' => ['Flour' => 0.05, 'Onion' => 0.02, 'Cooking Oil' => 0.03]],
            ['category' => 'Appetizers', 'name' => 'Cheese Naan', 'description' => 'Freshly baked naan stuffed with melted cheese.', 'base_price' => 250.00, 'preparation_time' => 15, 'spice_level' => 'none', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.9, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/cheese-naan.jpg', 'ingredients' => ['Flour' => 0.1, 'Paneer' => 0.05]],
            ['category' => 'Appetizers', 'name' => 'Hummus with Pita', 'description' => 'Creamy hummus served with warm pita bread.', 'base_price' => 400.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Middle Eastern', 'is_vegetarian' => true, 'popularity_score' => 4.0, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/hummus-with-pita.jpg', 'ingredients' => ['Flour' => 0.05, 'Cooking Oil' => 0.01]],
            ['category' => 'Appetizers', 'name' => 'Chicken Wings', 'description' => 'Spicy BBQ wings served with dip.', 'base_price' => 550.00, 'preparation_time' => 20, 'spice_level' => 'hot', 'cuisine_type' => 'American', 'is_vegetarian' => false, 'popularity_score' => 4.6, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chicken-wings.jpg', 'ingredients' => ['Chicken' => 0.2, 'Cooking Oil' => 0.05]],

            // --- Main Course (7 items) ---
            ['category' => 'Main Course', 'name' => 'Grilled Ribeye Steak', 'description' => 'Juicy ribeye steak with mashed potatoes.', 'base_price' => 2800.00, 'preparation_time' => 30, 'spice_level' => 'mild', 'cuisine_type' => 'Continental', 'is_vegetarian' => false, 'popularity_score' => 4.8, 'is_signature' => true, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/grilled-ribeye-steak.jpg', 'ingredients' => ['Beef' => 0.3, 'Potato' => 0.2]],
            ['category' => 'Main Course', 'name' => 'Chicken Parmesan', 'description' => 'Breaded chicken breast topped with marinara and cheese.', 'base_price' => 1200.00, 'preparation_time' => 25, 'spice_level' => 'mild', 'cuisine_type' => 'Italian', 'is_vegetarian' => false, 'popularity_score' => 4.5, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chicken-parmesan.jpg', 'ingredients' => ['Chicken' => 0.2, 'Tomato' => 0.1, 'Flour' => 0.05]],
            ['category' => 'Main Course', 'name' => 'Beef Burger', 'description' => 'Classic beef patty with lettuce, tomato, and cheese.', 'base_price' => 850.00, 'preparation_time' => 15, 'spice_level' => 'medium', 'cuisine_type' => 'American', 'is_vegetarian' => false, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/beef-burger.jpg', 'ingredients' => ['Beef' => 0.2, 'Flour' => 0.1, 'Tomato' => 0.05]],
            ['category' => 'Main Course', 'name' => 'Fish and Chips', 'description' => 'Crispy battered fish with thick-cut fries.', 'base_price' => 1100.00, 'preparation_time' => 20, 'spice_level' => 'none', 'cuisine_type' => 'British', 'is_vegetarian' => false, 'popularity_score' => 4.4, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/fish-and-chips.jpg', 'ingredients' => ['Fish' => 0.2, 'Potato' => 0.2, 'Flour' => 0.05, 'Cooking Oil' => 0.1]],
            ['category' => 'Main Course', 'name' => 'Mushroom Risotto', 'description' => 'Creamy Italian rice with wild mushrooms and parmesan.', 'base_price' => 1300.00, 'preparation_time' => 25, 'spice_level' => 'none', 'cuisine_type' => 'Italian', 'is_vegetarian' => true, 'popularity_score' => 4.2, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/mushroom-risotto.jpg', 'ingredients' => ['Rice' => 0.2, 'Milk' => 0.1]],
            ['category' => 'Main Course', 'name' => 'Grilled Salmon', 'description' => 'Fresh Atlantic salmon with lemon butter sauce.', 'base_price' => 2200.00, 'preparation_time' => 25, 'spice_level' => 'mild', 'cuisine_type' => 'Continental', 'is_vegetarian' => false, 'popularity_score' => 4.6, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/grilled-salmon.jpg', 'ingredients' => ['Fish' => 0.2]],
            ['category' => 'Main Course', 'name' => 'Paneer Tikka Masala', 'description' => 'Cottage cheese cubes in a rich tomato gravy.', 'base_price' => 900.00, 'preparation_time' => 20, 'spice_level' => 'medium', 'cuisine_type' => 'Indian', 'is_vegetarian' => true, 'popularity_score' => 4.5, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/paneer-tikka-masala.jpg', 'ingredients' => ['Paneer' => 0.2, 'Tomato' => 0.1, 'Yogurt' => 0.05]],

            // --- Pakistan Cuisine (7 items) ---
            ['category' => 'Pakistani Cuisine', 'name' => 'Chicken Karahi', 'description' => 'Traditional chicken cooked in a wok with tomatoes, green chillies, and spices.', 'base_price' => 1400.00, 'preparation_time' => 25, 'spice_level' => 'medium', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => false, 'popularity_score' => 4.9, 'is_signature' => true, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chicken-karahi.jpg', 'ingredients' => ['Chicken' => 0.5, 'Tomato' => 0.2, 'Cooking Oil' => 0.1, 'Yogurt' => 0.1]],
            ['category' => 'Pakistani Cuisine', 'name' => 'Mutton Biryani', 'description' => 'Fragrant basmati rice cooked with tender mutton and aromatic spices.', 'base_price' => 1600.00, 'preparation_time' => 30, 'spice_level' => 'medium', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => false, 'popularity_score' => 4.8, 'is_signature' => true, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/mutton-biryani.jpg', 'ingredients' => ['Mutton' => 0.4, 'Rice' => 0.3, 'Onion' => 0.1, 'Yogurt' => 0.1, 'Cooking Oil' => 0.05]],
            ['category' => 'Pakistani Cuisine', 'name' => 'Beef Nihari', 'description' => 'Slow-cooked beef stew, garnished with ginger and chillies.', 'base_price' => 1300.00, 'preparation_time' => 40, 'spice_level' => 'hot', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => false, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/beef-nihari.jpg', 'ingredients' => ['Beef' => 0.4, 'Flour' => 0.05, 'Cooking Oil' => 0.1]],
            ['category' => 'Pakistani Cuisine', 'name' => 'Daal Makhani', 'description' => 'Slow cooked black lentils with butter and cream.', 'base_price' => 700.00, 'preparation_time' => 20, 'spice_level' => 'medium', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.4, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/daal-makhani.jpg', 'ingredients' => ['Lentils' => 0.2, 'Milk' => 0.05, 'Tomato' => 0.1]],
            ['category' => 'Pakistani Cuisine', 'name' => 'Chicken Handi', 'description' => 'Boneless chicken in a creamy, mildly spiced gravy.', 'base_price' => 1500.00, 'preparation_time' => 25, 'spice_level' => 'mild', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => false, 'popularity_score' => 4.8, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chicken-handi.jpg', 'ingredients' => ['Chicken' => 0.4, 'Yogurt' => 0.1, 'Milk' => 0.05, 'Cooking Oil' => 0.05]],
            ['category' => 'Pakistani Cuisine', 'name' => 'Mutton Pulao', 'description' => 'Subtly spiced rice cooked in rich mutton broth.', 'base_price' => 1400.00, 'preparation_time' => 30, 'spice_level' => 'mild', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => false, 'popularity_score' => 4.6, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/mutton-pulao.jpg', 'ingredients' => ['Mutton' => 0.3, 'Rice' => 0.3, 'Onion' => 0.1]],
            ['category' => 'Pakistani Cuisine', 'name' => 'Chapli Kebab', 'description' => 'Peshawari style flat beef kebabs with spices.', 'base_price' => 800.00, 'preparation_time' => 20, 'spice_level' => 'hot', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => false, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chapli-kebab.jpg', 'ingredients' => ['Beef' => 0.3, 'Tomato' => 0.05, 'Onion' => 0.05, 'Cooking Oil' => 0.05]],

            // --- Asian Cuisine (7 items) ---
            ['category' => 'Asian Cuisine', 'name' => 'Chicken Manchurian', 'description' => 'Fried chicken chunks in a sweet and spicy sauce.', 'base_price' => 1100.00, 'preparation_time' => 20, 'spice_level' => 'medium', 'cuisine_type' => 'Asian', 'is_vegetarian' => false, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chicken-manchurian.jpg', 'ingredients' => ['Chicken' => 0.2, 'Soy Sauce' => 0.02, 'Cooking Oil' => 0.05]],
            ['category' => 'Asian Cuisine', 'name' => 'Beef Chilli Dry', 'description' => 'Stir-fried beef strips with green chillies.', 'base_price' => 1250.00, 'preparation_time' => 20, 'spice_level' => 'hot', 'cuisine_type' => 'Asian', 'is_vegetarian' => false, 'popularity_score' => 4.8, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/beef-chilli-dry.jpg', 'ingredients' => ['Beef' => 0.2, 'Soy Sauce' => 0.02, 'Cooking Oil' => 0.05]],
            ['category' => 'Asian Cuisine', 'name' => 'Egg Fried Rice', 'description' => 'Classic wok-tossed rice with vegetables and egg.', 'base_price' => 600.00, 'preparation_time' => 15, 'spice_level' => 'mild', 'cuisine_type' => 'Asian', 'is_vegetarian' => false, 'popularity_score' => 4.5, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/egg-fried-rice.jpg', 'ingredients' => ['Rice' => 0.2, 'Soy Sauce' => 0.01, 'Cooking Oil' => 0.02]],
            ['category' => 'Asian Cuisine', 'name' => 'Chicken Chow Mein', 'description' => 'Stir-fried noodles with chicken and vegetables.', 'base_price' => 900.00, 'preparation_time' => 15, 'spice_level' => 'medium', 'cuisine_type' => 'Asian', 'is_vegetarian' => false, 'popularity_score' => 4.6, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chicken-chow-mein.jpg', 'ingredients' => ['Noodles' => 0.2, 'Chicken' => 0.1, 'Soy Sauce' => 0.02]],
            ['category' => 'Asian Cuisine', 'name' => 'Sweet and Sour Fish', 'description' => 'Battered fish fillets in a vibrant tangy sauce.', 'base_price' => 1350.00, 'preparation_time' => 25, 'spice_level' => 'mild', 'cuisine_type' => 'Asian', 'is_vegetarian' => false, 'popularity_score' => 4.4, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/sweet-and-sour-fish.jpg', 'ingredients' => ['Fish' => 0.2, 'Tomato' => 0.05, 'Soy Sauce' => 0.01]],
            ['category' => 'Asian Cuisine', 'name' => 'Kung Pao Chicken', 'description' => 'Spicy diced chicken with peanuts and vegetables.', 'base_price' => 1150.00, 'preparation_time' => 20, 'spice_level' => 'hot', 'cuisine_type' => 'Asian', 'is_vegetarian' => false, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/kung-pao-chicken.jpg', 'ingredients' => ['Chicken' => 0.2, 'Soy Sauce' => 0.02, 'Cooking Oil' => 0.05]],
            ['category' => 'Asian Cuisine', 'name' => 'Vegetable Hakka Noodles', 'description' => 'Wok-tossed noodles with mixed vegetables and soy.', 'base_price' => 700.00, 'preparation_time' => 15, 'spice_level' => 'medium', 'cuisine_type' => 'Asian', 'is_vegetarian' => true, 'popularity_score' => 4.3, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/vegetable-hakka-noodles.jpg', 'ingredients' => ['Noodles' => 0.2, 'Soy Sauce' => 0.02, 'Onion' => 0.05]],

            // --- Desserts (7 items) ---
            ['category' => 'Desserts', 'name' => 'Gulab Jamun', 'description' => 'Deep-fried milk spheres soaked in rose-flavored sugar syrup.', 'base_price' => 350.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.6, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/gulab-jamun.jpg', 'ingredients' => ['Milk' => 0.2, 'Sugar' => 0.1, 'Flour' => 0.05, 'Cooking Oil' => 0.1]],
            ['category' => 'Desserts', 'name' => 'Kheer', 'description' => 'Traditional rice pudding cooked with milk, sugar, and nuts.', 'base_price' => 400.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.5, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/kheer.jpg', 'ingredients' => ['Milk' => 0.3, 'Rice' => 0.1, 'Sugar' => 0.05]],
            ['category' => 'Desserts', 'name' => 'Chocolate Lava Cake', 'description' => 'Warm chocolate cake with a gooey molten center.', 'base_price' => 600.00, 'preparation_time' => 15, 'spice_level' => 'none', 'cuisine_type' => 'Continental', 'is_vegetarian' => true, 'popularity_score' => 4.8, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/chocolate-lava-cake.jpg', 'ingredients' => ['Flour' => 0.05, 'Sugar' => 0.05, 'Milk' => 0.02]],
            ['category' => 'Desserts', 'name' => 'Rasmalai', 'description' => 'Soft cottage cheese dumplings soaked in sweetened milk.', 'base_price' => 450.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/rasmalai.jpg', 'ingredients' => ['Milk' => 0.2, 'Paneer' => 0.1, 'Sugar' => 0.05]],
            ['category' => 'Desserts', 'name' => 'Cheesecake', 'description' => 'Classic New York style cheesecake with strawberry compote.', 'base_price' => 700.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Continental', 'is_vegetarian' => true, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/cheesecake.jpg', 'ingredients' => ['Milk' => 0.1, 'Sugar' => 0.05, 'Flour' => 0.05]],
            ['category' => 'Desserts', 'name' => 'Gajar ka Halwa', 'description' => 'Warm carrot pudding cooked with milk and nuts.', 'base_price' => 400.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.5, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/gajar-ka-halwa.jpg', 'ingredients' => ['Milk' => 0.1, 'Sugar' => 0.05, 'Cooking Oil' => 0.05]],
            ['category' => 'Desserts', 'name' => 'Ice Cream Sundae', 'description' => 'Three scoops of ice cream topped with chocolate syrup and nuts.', 'base_price' => 450.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Continental', 'is_vegetarian' => true, 'popularity_score' => 4.6, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/ice-cream-sundae.jpg', 'ingredients' => ['Milk' => 0.2, 'Sugar' => 0.05]],

            // --- Beverages (7 items) ---
            ['category' => 'Beverages', 'name' => 'Sweet Lassi', 'description' => 'Refreshing and thick sweet yogurt-based drink.', 'base_price' => 250.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/sweet-lassi.jpg', 'ingredients' => ['Yogurt' => 0.2, 'Milk' => 0.1, 'Sugar' => 0.05]],
            ['category' => 'Beverages', 'name' => 'Karak Chai', 'description' => 'Strong milk tea brewed to perfection.', 'base_price' => 150.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.8, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/karak-chai.jpg', 'ingredients' => ['Milk' => 0.1, 'Tea Leaves' => 0.02, 'Sugar' => 0.02]],
            ['category' => 'Beverages', 'name' => 'Mint Margarita', 'description' => 'Chilled mint and lemon drink.', 'base_price' => 300.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Continental', 'is_vegetarian' => true, 'popularity_score' => 4.6, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/mint-margarita.jpg', 'ingredients' => ['Sugar' => 0.02]],
            ['category' => 'Beverages', 'name' => 'Pina Colada', 'description' => 'Creamy coconut and pineapple blend.', 'base_price' => 450.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Continental', 'is_vegetarian' => true, 'popularity_score' => 4.5, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/pina-colada.jpg', 'ingredients' => ['Milk' => 0.1, 'Sugar' => 0.03]],
            ['category' => 'Beverages', 'name' => 'Fresh Lime Sprite', 'description' => 'Classic lemon-lime soda with fresh lemon juice.', 'base_price' => 200.00, 'preparation_time' => 2, 'spice_level' => 'none', 'cuisine_type' => 'Continental', 'is_vegetarian' => true, 'popularity_score' => 4.4, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/fresh-lime-sprite.jpg', 'ingredients' => ['Sugar' => 0.01]],
            ['category' => 'Beverages', 'name' => 'Cappuccino', 'description' => 'Freshly brewed espresso topped with frothy milk.', 'base_price' => 400.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Continental', 'is_vegetarian' => true, 'popularity_score' => 4.7, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/cappuccino.jpg', 'ingredients' => ['Milk' => 0.1, 'Coffee Beans' => 0.02]],
            ['category' => 'Beverages', 'name' => 'Mango Shake', 'description' => 'Thick and creamy mango milkshake.', 'base_price' => 350.00, 'preparation_time' => 5, 'spice_level' => 'none', 'cuisine_type' => 'Pakistani', 'is_vegetarian' => true, 'popularity_score' => 4.6, 'image_url' => 'https://table-com-pk.s3.ap-southeast-1.amazonaws.com/test-images/mango-shake.jpg', 'ingredients' => ['Milk' => 0.2, 'Sugar' => 0.02]],
        ];

        foreach ($menuItemsData as $itemData) {
            $requiredIngredients = $itemData['ingredients'];
            unset($itemData['ingredients']);
            
            $itemData['restaurant_id'] = $restaurantId;
            $itemData['category_id'] = $categoryIds[$itemData['category']];
            unset($itemData['category']);
            
            $itemData['slug'] = Str::slug($itemData['name']);
            if (!isset($itemData['is_signature'])) $itemData['is_signature'] = false;
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
