<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RestaurantRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->routeIs('restaurant-registration.existing')) {
            $user = $this->user();

            return $user && $user->role === 'customer' && ! $user->restaurant_id && $user->is_active;
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
            'phone' => preg_replace('/[\s()-]+/', '', (string) $this->input('phone')),
            'restaurant_slug' => strtolower(trim((string) $this->input('restaurant_slug'))),
        ]);
    }

    public function rules(): array
    {
        $existing = $this->routeIs('restaurant-registration.existing');
        $userId = $existing ? $this->user()->id : null;

        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users')->ignore($userId)],
            'phone' => ['required', 'regex:/^\+?[0-9]{8,15}$/', Rule::unique('users')->ignore($userId)],
            'password' => $existing ? ['prohibited'] : ['required', 'string', 'min:8', 'max:128', 'confirmed'],
            'restaurant_name' => ['required', 'string', 'max:150'],
            'restaurant_slug' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('restaurants', 'slug'), Rule::notIn(['admin', 'api', 'partners', 'menu', 'login', 'register', 'scan', 'payment', 'reservations', 'ar-proxy'])],
            'restaurant_address' => ['required', 'string', 'max:1000'],
            'restaurant_phone' => ['required', 'regex:/^\+?[0-9\s()-]{8,20}$/'],
            'restaurant_email' => ['required', 'email', 'max:150'],
            'opening_time' => ['nullable', 'required_with:closing_time', 'date_format:H:i'],
            'closing_time' => ['nullable', 'required_with:opening_time', 'date_format:H:i', 'different:opening_time'],
            'timezone' => ['required', 'timezone'],
            'role' => ['prohibited'], 'restaurant_id' => ['prohibited'], 'is_active' => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'This email already has an account. Sign in to continue with your existing account.',
            'phone.unique' => 'This phone already belongs to an account. Sign in or use another phone.',
            'restaurant_slug.unique' => 'That restaurant link is taken. Choose another link.',
            'restaurant_slug.regex' => 'Use lowercase letters, numbers, and single hyphens for your restaurant link.',
        ];
    }
}
