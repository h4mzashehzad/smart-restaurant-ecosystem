<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRestaurantRole
{
    /**
     * @param  string  ...$roles  Allowed roles (e.g. admin, staff).
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($roles !== [] && ! in_array($user->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Insufficient role.',
            ], 403);
        }

        if (in_array($user->role, ['admin', 'staff'], true)) {
            if (! $user->restaurant_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No restaurant is associated with this account.',
                ], 403);
            }

            if ($user->is_active === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'This account has been deactivated.',
                ], 403);
            }
        }

        return $next($request);
    }
}
