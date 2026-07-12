<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

trait ResolvesRestaurant
{
    /**
     * Always use the authenticated operator's restaurant.
     * Never trust client-supplied restaurant_id.
     */
    protected function restaurantId(Request $request): int
    {
        $restaurantId = $request->user()?->restaurant_id;

        if (! $restaurantId) {
            throw new HttpException(403, 'No restaurant is associated with this account.');
        }

        return (int) $restaurantId;
    }
}
