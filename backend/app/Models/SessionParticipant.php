<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SessionParticipant extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'session_id',
        'user_id',
        'device_id',
        'joined_at',
        'left_at',
    ];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'participant_id');
    }

    public function splitBillItems(): HasMany
    {
        return $this->hasMany(SplitBillItem::class, 'participant_id');
    }
}
