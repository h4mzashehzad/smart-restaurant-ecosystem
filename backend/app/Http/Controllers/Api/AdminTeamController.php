<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesRestaurant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTeamMemberRequest;
use App\Http\Requests\Admin\UpdateTeamMemberRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminTeamController extends Controller
{
    use ResolvesRestaurant;

    /**
     * List all admin + staff members for the authenticated restaurant.
     * Password hashes are never returned (User::$hidden covers this).
     */
    public function index(Request $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $team = User::where('restaurant_id', $restaurantId)
            ->whereIn('role', ['admin', 'staff'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $team,
        ]);
    }

    /**
     * Create a new admin or staff member bound to the authenticated restaurant.
     */
    public function store(StoreTeamMemberRequest $request): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $member = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'restaurant_id' => $restaurantId,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Team member created',
            'data' => $member,
        ], 201);
    }

    /**
     * Update a team member's profile, role, active state, or password.
     * Blocks demoting/deactivating the last active admin for this restaurant.
     */
    public function update(UpdateTeamMemberRequest $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $member = User::where('restaurant_id', $restaurantId)
            ->whereIn('role', ['admin', 'staff'])
            ->findOrFail($id);

        $isCurrentlyActiveAdmin = $member->role === 'admin' && $member->is_active;
        $demotingAdmin = $isCurrentlyActiveAdmin && $request->filled('role') && $request->input('role') !== 'admin';
        $deactivatingAdmin = $isCurrentlyActiveAdmin && $request->has('is_active') && ! $request->boolean('is_active');

        if (($demotingAdmin || $deactivatingAdmin) && $this->isLastActiveAdmin($restaurantId, $member)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot '.($demotingAdmin ? 'change the role of' : 'deactivate').' the last active admin for this restaurant.',
            ], 422);
        }

        $updates = array_filter(
            $request->only(['name', 'email', 'phone', 'role']),
            fn ($value) => $value !== null,
        );

        if ($request->has('is_active')) {
            $updates['is_active'] = $request->boolean('is_active');
        }

        if ($request->filled('password')) {
            $updates['password'] = Hash::make($request->password);
        }

        $member->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Team member updated',
            'data' => $member->fresh(),
        ]);
    }

    /**
     * Deactivate a team member. Blocks deactivating the last active admin.
     */
    public function deactivate(Request $request, int $id): JsonResponse
    {
        $restaurantId = $this->restaurantId($request);

        $member = User::where('restaurant_id', $restaurantId)
            ->whereIn('role', ['admin', 'staff'])
            ->findOrFail($id);

        if ($member->role === 'admin' && $member->is_active && $this->isLastActiveAdmin($restaurantId, $member)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot deactivate the last active admin for this restaurant.',
            ], 422);
        }

        $member->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Team member deactivated',
            'data' => $member->fresh(),
        ]);
    }

    /**
     * Whether the given member is the only active admin left for the restaurant.
     */
    protected function isLastActiveAdmin(int $restaurantId, User $member): bool
    {
        $hasOtherActiveAdmin = User::where('restaurant_id', $restaurantId)
            ->where('role', 'admin')
            ->where('is_active', true)
            ->where('id', '!=', $member->id)
            ->exists();

        return ! $hasOtherActiveAdmin;
    }
}
