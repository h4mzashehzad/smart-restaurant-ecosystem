<?php

namespace App\Events;

use App\Models\Feedback;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FeedbackFlagged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Feedback $feedback;

    /**
     * Create a new event instance.
     *
     * Expects the feedback to be loaded with: user, order.table, feedbackMenuItems.menuItem
     */
    public function __construct(Feedback $feedback)
    {
        $this->feedback = $feedback;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('feedback:flagged'),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'feedback_id'     => $this->feedback->id,
            'order_id'        => $this->feedback->order_id,
            'restaurant_id'   => $this->feedback->restaurant_id,
            'rating'          => $this->feedback->rating,
            'review_text'     => $this->feedback->review_text,
            'sentiment_label' => $this->feedback->sentiment_label,
            'sentiment_score' => $this->feedback->sentiment_score,
            'flagged_reason'  => $this->feedback->flagged_reason,
            'user_name'       => $this->feedback->user?->name ?? 'Guest',
            'table_number'    => $this->feedback->order?->table?->table_number,
            'created_at'      => $this->feedback->created_at?->toISOString(),
            'item_ratings'    => $this->feedback->feedbackMenuItems->map(fn ($item) => [
                'menu_item_name'  => $item->menuItem?->name,
                'rating'          => $item->item_rating,
                'review_text'     => $item->item_review_text,
                'sentiment_label' => $item->item_sentiment_label,
                'is_flagged'      => $item->item_is_flagged,
            ])->toArray(),
        ];
    }
}
