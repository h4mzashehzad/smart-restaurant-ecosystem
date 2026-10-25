<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RestaurantRegistrationCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'challenge_id' => ['required', 'uuid'],
            'otp' => $this->routeIs('restaurant-registration.verify') ? ['required', 'digits:6'] : ['prohibited'],
        ];
    }
}
