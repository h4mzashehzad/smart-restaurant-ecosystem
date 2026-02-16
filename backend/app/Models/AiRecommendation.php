<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiRecommendation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'session_id',
        'menu_item_id',
        'recommendation_score',
        'recommendation_reason',
        'context_data',
        'was_accepted',
    ];

    protected function casts(): array
    {
        return [
            'recommendation_score' => 'decimal:4',
            'context_data' => 'json',
            'was_accepted' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'session_id');
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
