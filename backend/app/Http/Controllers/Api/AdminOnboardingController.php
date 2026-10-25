<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOnboardingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOnboardingController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $restaurant = $request->user()->restaurant;

        return response()->json(['success' => true, 'data' => [
            'tour' => $request->user()->admin_onboarding,
            'setup' => [
                'profile' => (bool) ($restaurant->address && $restaurant->phone && $restaurant->opening_time && $restaurant->closing_time),
                'menu' => $restaurant->menuItems()->exists(), 'categories' => $restaurant->categories()->exists(),
                'tables' => $restaurant->tables()->exists(),
                'team' => $restaurant->staff()->where('id', '!=', $request->user()->id)->where('is_active', true)->exists(),
                'slug' => $restaurant->slug, 'restaurant_id' => $restaurant->id,
            ],
        ]]);
    }

    public function update(UpdateOnboardingRequest $request): JsonResponse
    {
        $state = [...$request->validated(), 'updated_at' => now()->toISOString()];
        $request->user()->forceFill(['admin_onboarding' => $state])->save();

        return response()->json(['success' => true, 'data' => $state]);
    }
}
