<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRestaurantRequest;
use App\Models\Restaurant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminRestaurantController extends Controller
{
    use ResolvesRestaurant;

    /**
     * Show the authenticated operator's own restaurant.
     */
    public function show(Request $request): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($this->restaurantId($request));

        return response()->json([
            'success' => true,
            'data' => $restaurant,
        ]);
    }

    /**
     * Update the authenticated operator's own restaurant.
     */
    public function update(UpdateRestaurantRequest $request): JsonResponse
    {
        $restaurant = Restaurant::findOrFail($this->restaurantId($request));

        $restaurant->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Restaurant updated',
            'data' => $restaurant->fresh(),
        ]);
    }
}
