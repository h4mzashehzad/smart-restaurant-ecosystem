<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class FeedbackMenuItem extends Pivot
{
    protected $table = 'feedback_menu_items';

    public $incrementing = true;

    public $timestamps = false;

    protected $fillable = [
        'feedback_id',
        'menu_item_id',
        'item_rating',
        'item_review_text',
        'item_sentiment_score',
        'item_sentiment_label',
        'item_is_flagged',
    ];

    protected function casts(): array
    {
        return [
            'item_rating' => 'integer',
            'item_sentiment_score' => 'decimal:4',
            'item_is_flagged' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function feedback(): BelongsTo
    {
        return $this->belongsTo(Feedback::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
