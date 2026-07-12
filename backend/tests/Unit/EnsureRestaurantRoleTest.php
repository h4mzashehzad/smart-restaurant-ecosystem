<?php

use App\Http\Middleware\EnsureRestaurantRole;
use App\Models\User;
use Illuminate\Http\Request;

function runRoleMiddleware(?User $user, string ...$roles): int
{
    $request = Request::create('/api/admin/dashboard/stats', 'GET');
    if ($user) {
        $request->setUserResolver(fn () => $user);
    }

    $middleware = new EnsureRestaurantRole;
    $response = $middleware->handle($request, fn () => response('ok', 200), ...$roles);

    return $response->getStatusCode();
}

test('unauthenticated requests are rejected', function () {
    expect(runRoleMiddleware(null, 'admin', 'staff'))->toBe(401);
});

test('customers cannot access admin or staff routes', function () {
    $customer = new User([
        'role' => 'customer',
        'restaurant_id' => null,
        'is_active' => true,
    ]);

    expect(runRoleMiddleware($customer, 'admin', 'staff'))->toBe(403);
});

test('admin without restaurant is forbidden', function () {
    $admin = new User([
        'role' => 'admin',
        'restaurant_id' => null,
        'is_active' => true,
    ]);

    expect(runRoleMiddleware($admin, 'admin', 'staff'))->toBe(403);
});

test('inactive staff is forbidden', function () {
    $staff = new User([
        'role' => 'staff',
        'restaurant_id' => 1,
        'is_active' => false,
    ]);

    expect(runRoleMiddleware($staff, 'admin', 'staff'))->toBe(403);
});

test('active admin bound to a restaurant is allowed', function () {
    $admin = new User([
        'role' => 'admin',
        'restaurant_id' => 1,
        'is_active' => true,
    ]);

    expect(runRoleMiddleware($admin, 'admin', 'staff'))->toBe(200);
});

test('staff cannot pass admin-only middleware', function () {
    $staff = new User([
        'role' => 'staff',
        'restaurant_id' => 1,
        'is_active' => true,
    ]);

    expect(runRoleMiddleware($staff, 'admin'))->toBe(403);
});
