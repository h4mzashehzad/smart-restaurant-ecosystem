<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@lahorekarahi.pk'],
            [
                'name'     => 'Admin User',
                'phone'    => '+923009999999',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
            ]
        );
    }
}
