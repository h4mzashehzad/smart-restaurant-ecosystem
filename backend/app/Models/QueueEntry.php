<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueueEntry extends Model
{
    public $timestamps = false;

    protected $table = 'queue_entries';

    protected $fillable = [
        'restaurant_id',
        'user_id',
        'guest_name',
        'guest_phone',
        'party_size',
        'queue_number',
        'estimated_wait_time',
        'status',
        'joined_at',
        'called_at',
        'seated_at',
    ];

    protected function casts(): array
    {
        return [
            'party_size' => 'integer',
            'queue_number' => 'integer',
            'estimated_wait_time' => 'integer',
            'joined_at' => 'datetime',
            'called_at' => 'datetime',
            'seated_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
