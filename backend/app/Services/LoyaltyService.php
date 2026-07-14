<?php

namespace App\Services;

use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class LoyaltyService
{
    /**
     * Resolve loyalty tier from total points.
     */
    public function tierForPoints(int $points): string
    {
        $tiers = config('loyalty.tiers');

        if ($points >= ($tiers['gold']['min_points'] ?? 1500)) {
            return 'gold';
        }

        if ($points >= ($tiers['silver']['min_points'] ?? 500)) {
            return 'silver';
        }

        return 'bronze';
    }

    /**
     * Calculate loyalty discount for a user's current tier against a pre-tax subtotal.
     *
     * @return array{tier: string, percent: float, amount: float}
     */
    public function discountFor(User $user, float $subtotal): array
    {
        $tier = $user->loyalty_tier ?: 'bronze';
        $tiers = config('loyalty.tiers', []);
        $config = $tiers[$tier] ?? $tiers['bronze'] ?? [
            'discount_percent' => 5,
            'min_order_subtotal' => 1000,
        ];

        $percent = (float) ($config['discount_percent'] ?? 0);
        $minSubtotal = (float) ($config['min_order_subtotal'] ?? 0);

        if ($subtotal < $minSubtotal || $percent <= 0) {
            return [
                'tier' => $tier,
                'percent' => 0.0,
                'amount' => 0.0,
            ];
        }

        $amount = round($subtotal * ($percent / 100), 2);

        return [
            'tier' => $tier,
            'percent' => $percent,
            'amount' => $amount,
        ];
    }

    /**
     * Award loyalty points after an order is fully paid.
     * Idempotent: skips if an earned transaction already exists for the order.
     */
    public function awardPoints(Order $order): void
    {
        if (! $order->user_id) {
            return;
        }

        $alreadyEarned = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('transaction_type', 'earned')
            ->exists();

        if ($alreadyEarned) {
            return;
        }

        $eligibleAmount = max(
            0.0,
            (float) $order->subtotal - (float) $order->discount_amount
        );
        $rupeesPerPoint = max(1, (int) config('loyalty.rupees_per_point', 20));
        $points = (int) floor($eligibleAmount / $rupeesPerPoint);

        if ($points <= 0) {
            return;
        }

        DB::transaction(function () use ($order, $points) {
            $user = User::query()->lockForUpdate()->find($order->user_id);
            if (! $user) {
                return;
            }

            $user->loyalty_points = (int) $user->loyalty_points + $points;
            $user->loyalty_tier = $this->tierForPoints((int) $user->loyalty_points);
            $user->save();

            LoyaltyTransaction::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'transaction_type' => 'earned',
                'points' => $points,
                'balance_after' => (int) $user->loyalty_points,
                'description' => "Earned from order {$order->order_number}",
            ]);
        });
    }

    /**
     * Reverse points previously earned for an order (e.g. on cancellation).
     * Idempotent: skips if no earned transaction exists or already reversed.
     */
    public function reversePoints(Order $order): void
    {
        if (! $order->user_id) {
            return;
        }

        $earned = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('transaction_type', 'earned')
            ->first();

        if (! $earned) {
            return;
        }

        $alreadyReversed = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('transaction_type', 'adjusted')
            ->where('description', 'like', 'Reversed points for order%')
            ->exists();

        if ($alreadyReversed) {
            return;
        }

        $pointsToReverse = abs((int) $earned->points);
        if ($pointsToReverse <= 0) {
            return;
        }

        DB::transaction(function () use ($order, $pointsToReverse) {
            $user = User::query()->lockForUpdate()->find($order->user_id);
            if (! $user) {
                return;
            }

            $user->loyalty_points = max(0, (int) $user->loyalty_points - $pointsToReverse);
            $user->loyalty_tier = $this->tierForPoints((int) $user->loyalty_points);
            $user->save();

            LoyaltyTransaction::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'transaction_type' => 'adjusted',
                'points' => -$pointsToReverse,
                'balance_after' => (int) $user->loyalty_points,
                'description' => "Reversed points for order {$order->order_number}",
            ]);
        });
    }

    /**
     * Snapshot used by the customer loyalty dashboard.
     *
     * @return array{
     *     loyalty_points: int,
     *     loyalty_tier: string,
     *     current_tier: array{name: string, discount_percent: float, min_order_subtotal: float, min_points: int},
     *     next_tier: array{name: string, points_needed: int, min_points: int}|null,
     *     progress_percent: float
     * }
     */
    public function snapshotFor(User $user): array
    {
        $points = (int) $user->loyalty_points;
        $tier = $user->loyalty_tier ?: $this->tierForPoints($points);
        $tiers = config('loyalty.tiers', []);
        $current = $tiers[$tier] ?? $tiers['bronze'];

        $order = ['bronze', 'silver', 'gold'];
        $idx = array_search($tier, $order, true);
        $nextName = ($idx !== false && isset($order[$idx + 1])) ? $order[$idx + 1] : null;

        $nextTier = null;
        $progressPercent = 100.0;

        if ($nextName && isset($tiers[$nextName])) {
            $nextMin = (int) $tiers[$nextName]['min_points'];
            $currentMin = (int) ($current['min_points'] ?? 0);
            $span = max(1, $nextMin - $currentMin);
            $progressPercent = round(min(100, max(0, (($points - $currentMin) / $span) * 100)), 1);

            $nextTier = [
                'name' => $nextName,
                'points_needed' => max(0, $nextMin - $points),
                'min_points' => $nextMin,
            ];
        }

        return [
            'loyalty_points' => $points,
            'loyalty_tier' => $tier,
            'current_tier' => [
                'name' => $tier,
                'discount_percent' => (float) ($current['discount_percent'] ?? 0),
                'min_order_subtotal' => (float) ($current['min_order_subtotal'] ?? 0),
                'min_points' => (int) ($current['min_points'] ?? 0),
            ],
            'next_tier' => $nextTier,
            'progress_percent' => $progressPercent,
        ];
    }
}
