<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Feedback extends Model
{
    use HasFactory;

    protected $table = 'feedback';

    protected $fillable = [
        'restaurant_id',
        'order_id',
        'user_id',
        'rating',
        'review_text',
        'sentiment_score',
        'sentiment_label',
        'sentiment_confidence',
        'is_flagged',
        'flagged_reason',
        'admin_response',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'sentiment_score' => 'decimal:4',
            'sentiment_confidence' => 'decimal:4',
            'is_flagged' => 'boolean',
            'responded_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function feedbackMenuItems(): HasMany
    {
        return $this->hasMany(FeedbackMenuItem::class);
    }

    public function menuItems(): BelongsToMany
    {
        return $this->belongsToMany(MenuItem::class, 'feedback_menu_items')
            ->withPivot('item_rating');
    }
}
