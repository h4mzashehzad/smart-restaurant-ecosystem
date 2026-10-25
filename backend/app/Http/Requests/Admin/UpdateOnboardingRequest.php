<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['admin', 'staff'], true);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'in:active,skipped,completed'],
            'step' => ['required', 'integer', 'min:0', 'max:16'],
            'version' => ['required', 'integer', 'in:1'],
        ];
    }
}
