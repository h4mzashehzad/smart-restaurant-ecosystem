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
    ];

    protected function casts(): array
    {
        return [
            'item_rating' => 'integer',
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
