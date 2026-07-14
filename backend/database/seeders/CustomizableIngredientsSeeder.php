<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CustomizableIngredientsSeeder extends Seeder
{
    /**
     * Seed piece/portion-based ingredients suitable for customer quantity pickers.
     * Intentionally NOT linked to any menu items — admins attach them manually.
     */
    public function run(): void
    {
        $restaurantId = DB::table('restaurants')
            ->where('slug', 'darbar-restaurant')
            ->value('id');

        if (! $restaurantId) {
            $restaurantId = DB::table('restaurants')->orderBy('id')->value('id');
        }

        if (! $restaurantId) {
            $this->command?->warn('No restaurant found — skipping CustomizableIngredientsSeeder.');

            return;
        }

        $ingredients = [
            [
                'name' => 'Cheese Slice',
                'unit' => 'piece',
                'cost_per_unit' => 25.00,
                'is_allergen' => true,
                'allergen_type' => 'Dairy',
            ],
            [
                'name' => 'Tomato Slice',
                'unit' => 'piece',
                'cost_per_unit' => 8.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
            [
                'name' => 'Lettuce Leaf',
                'unit' => 'piece',
                'cost_per_unit' => 5.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
            [
                'name' => 'Onion Rings',
                'unit' => 'piece',
                'cost_per_unit' => 15.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
            [
                'name' => 'Pickled Jalapeños',
                'unit' => 'piece',
                'cost_per_unit' => 10.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
            [
                'name' => 'Fried Egg',
                'unit' => 'piece',
                'cost_per_unit' => 40.00,
                'is_allergen' => true,
                'allergen_type' => 'Egg',
            ],
            [
                'name' => 'Bacon Strip',
                'unit' => 'piece',
                'cost_per_unit' => 50.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
            [
                'name' => 'Mushroom Slices',
                'unit' => 'portion',
                'cost_per_unit' => 30.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
            [
                'name' => 'Mayonnaise',
                'unit' => 'tbsp',
                'cost_per_unit' => 8.00,
                'is_allergen' => true,
                'allergen_type' => 'Egg',
            ],
            [
                'name' => 'Olives',
                'unit' => 'piece',
                'cost_per_unit' => 12.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
            [
                'name' => 'Pickle Slice',
                'unit' => 'piece',
                'cost_per_unit' => 6.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
            [
                'name' => 'Avocado Slice',
                'unit' => 'piece',
                'cost_per_unit' => 35.00,
                'is_allergen' => false,
                'allergen_type' => null,
            ],
        ];

        foreach ($ingredients as $ingredient) {
            $exists = DB::table('ingredients')
                ->where('restaurant_id', $restaurantId)
                ->where('name', $ingredient['name'])
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('ingredients')->insert([
                'restaurant_id' => $restaurantId,
                'name' => $ingredient['name'],
                'unit' => $ingredient['unit'],
                'cost_per_unit' => $ingredient['cost_per_unit'],
                'stock_quantity' => 100.00,
                'minimum_threshold' => 20.00,
                'is_allergen' => $ingredient['is_allergen'],
                'allergen_type' => $ingredient['allergen_type'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
