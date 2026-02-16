<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    public $timestamps = false;

    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'user_id',
        'preference_type',
        'preference_value',
        'weight',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'decimal:2',
            'updated_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
