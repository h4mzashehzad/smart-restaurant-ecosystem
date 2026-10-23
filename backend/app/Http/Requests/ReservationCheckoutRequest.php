<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReservationCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'restaurant_id' => 'required|integer|exists:restaurants,id', 'table_id' => 'required|integer|exists:tables,id',
            'guest_name' => 'required|string|min:2|max:100', 'guest_phone' => 'required|string|max:20',
            'guest_email' => 'required_with:items|nullable|email|max:150', 'party_size' => 'required|integer|min:1|max:20',
            'reservation_date' => 'required|date_format:Y-m-d', 'reservation_time' => 'required|date_format:H:i',
            'special_requests' => 'nullable|string|max:500', 'special_instructions' => 'nullable|string|max:500',
            'items' => 'nullable|array|min:1|max:50', 'items.*.menu_item_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1|max:20', 'items.*.customizations' => 'nullable|array',
            'items.*.customizations.*.ingredient_id' => 'required|integer',
            'items.*.customizations.*.action' => 'required|in:add,remove,modify', 'items.*.customizations.*.quantity' => 'nullable|numeric|min:0|max:1000',
            'expected_total' => 'required_with:items|numeric|min:0.01', 'checkout_key' => 'required_with:items|uuid',
            'policy_accepted' => $this->filled('items') ? ['required', 'accepted'] : ['exclude'], 'payment_method' => 'nullable|in:safepay',
        ];
    }

    public function messages(): array
    {
        return ['guest_email.required_with' => 'An email address is required for your prepaid reservation and cancellation link.',
            'payment_method.in' => 'Reservation preorders are payable by card through Safepay.',
            'policy_accepted.accepted' => 'Please accept the cancellation deadline and 5% fee before paying.'];
    }
}
