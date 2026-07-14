<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\SessionParticipant;
use App\Models\SplitBillItem;
use App\Models\TableSession;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use InvalidArgumentException;

class SplitBillService
{
    /**
     * Expand order items into claimable unit slots.
     *
     * @return array<int, array{order_item_id:int, unit_index:int, amount:float, name:string, menu_item_id:int}>
     */
    public function expandClaimableUnits(Order $order): array
    {
        $order->loadMissing('items.menuItem');
        $units = [];

        foreach ($order->items as $item) {
            $unitAmount = round((float) $item->unit_price, 2);
            for ($i = 0; $i < $item->quantity; $i++) {
                $units[] = [
                    'order_item_id' => $item->id,
                    'unit_index' => $i,
                    'amount' => $unitAmount,
                    'name' => $item->menuItem?->name ?? 'Item',
                    'menu_item_id' => $item->menu_item_id,
                ];
            }
        }

        return $units;
    }

    public function claimUnit(Order $order, SessionParticipant $participant, int $orderItemId, int $unitIndex): SplitBillItem
    {
        $orderItem = OrderItem::where('order_id', $order->id)->findOrFail($orderItemId);

        if ($unitIndex < 0 || $unitIndex >= $orderItem->quantity) {
            throw new InvalidArgumentException('Invalid unit index for this order item.');
        }

        $existing = SplitBillItem::where('order_item_id', $orderItemId)
            ->where('unit_index', $unitIndex)
            ->first();

        if ($existing && $existing->participant_id !== $participant->id) {
            throw new InvalidArgumentException('This item unit is already claimed by another participant.');
        }

        if ($existing) {
            return $existing;
        }

        return SplitBillItem::create([
            'payment_id' => null,
            'order_item_id' => $orderItemId,
            'unit_index' => $unitIndex,
            'participant_id' => $participant->id,
            'amount' => round((float) $orderItem->unit_price, 2),
        ]);
    }

    public function unclaimUnit(Order $order, SessionParticipant $participant, int $orderItemId, int $unitIndex): void
    {
        $claim = SplitBillItem::where('order_item_id', $orderItemId)
            ->where('unit_index', $unitIndex)
            ->where('participant_id', $participant->id)
            ->whereNull('payment_id')
            ->first();

        if ($claim) {
            $claim->delete();
        }
    }

    /**
     * Create equal-split payment rows for all active participants.
     *
     * @param  Collection<int, SessionParticipant>  $participants
     * @return Collection<int, Payment>
     */
    public function setupEqualSplit(Order $order, TableSession $session, Collection $participants): Collection
    {
        $existing = Payment::query()
            ->where('order_id', $order->id)
            ->where('payment_type', 'split_equal')
            ->whereNotNull('split_group_id')
            ->orderBy('id')
            ->get();

        if ($existing->isNotEmpty()) {
            return $existing;
        }

        $count = $participants->count();
        if ($count < 2) {
            throw new InvalidArgumentException('Equal split requires at least 2 participants.');
        }

        $total = round((float) $order->total_amount, 2);
        $base = floor(($total / $count) * 100) / 100;
        $amounts = array_fill(0, $count, $base);
        $amounts[$count - 1] = round($total - ($base * ($count - 1)), 2);

        $groupId = (string) Str::uuid();
        $expiresAt = now()->addMinutes(config('safepay.split_timeout_minutes', 10));
        $payments = collect();

        foreach ($participants->values() as $index => $participant) {
            $payments->push(Payment::create([
                'order_id' => $order->id,
                'session_id' => $session->id,
                'participant_id' => $participant->id,
                'user_id' => $participant->user_id,
                'payment_method' => 'cash',
                'payment_type' => 'split_equal',
                'split_group_id' => $groupId,
                'amount' => $amounts[$index],
                'transaction_id' => $this->makeTxnId(),
                'status' => 'pending',
                'expires_at' => $expiresAt,
            ]));
        }

        return $payments;
    }

    /**
     * Lock itemized claims into payment rows (one payment per participant with claims).
     *
     * @return Collection<int, Payment>
     */
    public function setupItemizedSplit(Order $order, TableSession $session): Collection
    {
        $existing = Payment::query()
            ->where('order_id', $order->id)
            ->where('payment_type', 'split_itemized')
            ->whereNotNull('split_group_id')
            ->orderBy('id')
            ->get();

        if ($existing->isNotEmpty()) {
            return $existing;
        }

        $claims = SplitBillItem::whereIn('order_item_id', $order->items()->pluck('id'))
            ->whereNull('payment_id')
            ->get();

        if ($claims->isEmpty()) {
            throw new InvalidArgumentException('No items have been claimed yet.');
        }

        $units = $this->expandClaimableUnits($order);
        $claimedKeys = $claims->map(fn ($c) => $c->order_item_id.':'.$c->unit_index)->unique();
        $allKeys = collect($units)->map(fn ($u) => $u['order_item_id'].':'.$u['unit_index']);

        if ($claimedKeys->count() !== $allKeys->count()) {
            throw new InvalidArgumentException('All item units must be claimed before locking the split.');
        }

        $subtotal = (float) $order->subtotal;
        $tax = (float) $order->tax_amount;
        $discount = (float) $order->discount_amount;
        $groupId = (string) Str::uuid();
        $expiresAt = now()->addMinutes(config('safepay.split_timeout_minutes', 10));
        $payments = collect();

        foreach ($claims->groupBy('participant_id') as $participantId => $participantClaims) {
            $itemsTotal = round($participantClaims->sum('amount'), 2);
            $taxShare = $subtotal > 0 ? round($tax * ($itemsTotal / $subtotal), 2) : 0;
            $discountShare = $subtotal > 0 ? round($discount * ($itemsTotal / $subtotal), 2) : 0;
            $amount = round($itemsTotal + $taxShare - $discountShare, 2);

            $participant = SessionParticipant::findOrFail($participantId);

            $payment = Payment::create([
                'order_id' => $order->id,
                'session_id' => $session->id,
                'participant_id' => $participant->id,
                'user_id' => $participant->user_id,
                'payment_method' => 'cash',
                'payment_type' => 'split_itemized',
                'split_group_id' => $groupId,
                'amount' => $amount,
                'transaction_id' => $this->makeTxnId(),
                'status' => 'pending',
                'expires_at' => $expiresAt,
            ]);

            SplitBillItem::whereIn('id', $participantClaims->pluck('id'))
                ->update(['payment_id' => $payment->id]);

            $payments->push($payment);
        }

        // Fix rounding drift on tax/discount shares so sum matches order total.
        $diff = round((float) $order->total_amount - $payments->sum('amount'), 2);
        if (abs($diff) >= 0.01) {
            $last = $payments->last();
            $last->update(['amount' => round((float) $last->amount + $diff, 2)]);
        }

        return $payments->map->fresh();
    }

    /**
     * Unlock an itemized split so guests can re-edit claims.
     * Only allowed while every share is still pending (no payment started).
     */
    public function unlockItemizedSplit(Order $order): void
    {
        $payments = Payment::query()
            ->where('order_id', $order->id)
            ->where('payment_type', 'split_itemized')
            ->whereNotNull('split_group_id')
            ->get();

        if ($payments->isEmpty()) {
            return;
        }

        $locked = $payments->contains(
            fn (Payment $p) => in_array($p->status, ['completed', 'processing', 'refunded'], true)
        );

        if ($locked) {
            throw new InvalidArgumentException('Cannot edit claims after a payment has started.');
        }

        $paymentIds = $payments->pluck('id');

        SplitBillItem::whereIn('payment_id', $paymentIds)->update(['payment_id' => null]);
        Payment::whereIn('id', $paymentIds)->delete();
    }

    public function makeTxnId(): string
    {
        return 'TXN-'.now()->format('YmdHis').'-'.random_int(1000, 9999);
    }
}
