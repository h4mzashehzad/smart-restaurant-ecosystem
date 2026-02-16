<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyReward;
use App\Models\LoyaltyTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LoyaltyController extends Controller
{
    /**
     * Get current loyalty points and tier.
     */
    public function points(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data'    => [
                'loyalty_points' => $user->loyalty_points,
                'loyalty_tier'   => $user->loyalty_tier,
            ],
        ]);
    }

    /**
     * Get loyalty transaction history.
     */
    public function transactions(Request $request): JsonResponse
    {
        $transactions = LoyaltyTransaction::where('user_id', $request->user()->id)
            ->with('order')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $transactions,
        ]);
    }

    /**
     * Get available rewards for the user's tier.
     */
    public function rewards(Request $request): JsonResponse
    {
        $user = $request->user();

        $rewards = LoyaltyReward::where('is_active', true)
            ->where('tier', '<=', $user->loyalty_tier)
            ->where('minimum_points', '<=', $user->loyalty_points)
            ->orderBy('minimum_points')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $rewards,
        ]);
    }

    /**
     * Redeem loyalty points for a reward.
     */
    public function redeem(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reward_id' => 'required|exists:loyalty_rewards,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user   = $request->user();
        $reward = LoyaltyReward::findOrFail($request->reward_id);

        if ($user->loyalty_points < $reward->minimum_points) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient loyalty points',
            ], 400);
        }

        // Deduct points
        $user->decrement('loyalty_points', $reward->minimum_points);

        $transaction = LoyaltyTransaction::create([
            'user_id'          => $user->id,
            'transaction_type' => 'redeemed',
            'points'           => -$reward->minimum_points,
            'balance_after'    => $user->fresh()->loyalty_points,
            'description'      => "Redeemed: {$reward->description}",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reward redeemed successfully',
            'data'    => [
                'transaction'      => $transaction,
                'remaining_points' => $user->fresh()->loyalty_points,
            ],
        ]);
    }
}
