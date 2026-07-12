<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTableRequest extends FormRequest
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
            'table_number' => [
                'required',
                'string',
                'max:20',
                Rule::unique('tables', 'table_number')->where('restaurant_id', $restaurantId),
            ],
            'capacity' => 'sometimes|integer|min:1|max:50',
            'status' => 'sometimes|in:available,occupied,reserved,maintenance',
        ];
    }
}
