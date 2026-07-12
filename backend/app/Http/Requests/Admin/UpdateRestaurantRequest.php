<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRestaurantRequest extends FormRequest
{
    /**
     * Authorization is enforced by the `restaurant.role:admin` route middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $restaurantId = $this->user()?->restaurant_id;

        return [
            'name' => 'sometimes|string|max:150',
            'slug' => [
                'sometimes',
                'string',
                'max:150',
                'alpha_dash',
                Rule::unique('restaurants', 'slug')->ignore($restaurantId),
            ],
            'address' => 'sometimes|nullable|string',
            'phone' => 'sometimes|nullable|string|max:20',
            'email' => 'sometimes|nullable|email|max:150',
            'opening_time' => 'sometimes|nullable|date_format:H:i',
            'closing_time' => 'sometimes|nullable|date_format:H:i',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
