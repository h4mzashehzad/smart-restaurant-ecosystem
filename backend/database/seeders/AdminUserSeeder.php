<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::query()->where('slug', 'darbar')->first()
            ?? Restaurant::query()->orderBy('id')->first();

        User::updateOrCreate(
            ['email' => 'admin@darbar.pk'],
            [
                'name' => 'Admin User',
                'phone' => '+923009999999',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'restaurant_id' => $restaurant?->id,
                'is_active' => true,
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@darbar.pk'],
            [
                'name' => 'Kitchen Staff',
                'phone' => '+923009999998',
                'password' => Hash::make('staff123'),
                'role' => 'staff',
                'restaurant_id' => $restaurant?->id,
                'is_active' => true,
            ]
        );
    }
}
