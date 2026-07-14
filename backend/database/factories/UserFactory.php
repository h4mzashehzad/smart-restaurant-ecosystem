<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->unique()->e164PhoneNumber(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'customer',
            'restaurant_id' => null,
            'is_active' => true,
            'loyalty_tier' => 'bronze',
            'loyalty_points' => 0,
        ];
    }

    public function admin(?int $restaurantId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'admin',
            'restaurant_id' => $restaurantId,
            'is_active' => true,
        ]);
    }

    public function staff(?int $restaurantId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'staff',
            'restaurant_id' => $restaurantId,
            'is_active' => true,
        ]);
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
