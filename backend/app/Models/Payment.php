<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'session_id',
        'user_id',
        'participant_id',
        'payment_method',
        'payment_type',
        'split_group_id',
        'amount',
        'transaction_id',
        'safepay_tracker_token',
        'safepay_reference_code',
        'gateway_response',
        'receipt_url',
        'receipt_s3_key',
        'status',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount'           => 'decimal:2',
            'gateway_response' => 'json',
            'paid_at'          => 'datetime',
        ];
    }

    // ── Scopes ──

    /**
     * Get all payments belonging to the same atomic split-bill group.
     */
    public function scopeSplitGroup($query, string $groupId)
    {
        return $query->where('split_group_id', $groupId);
    }

    // ── Helpers ──

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isVoided(): bool
    {
        return $this->status === 'voided';
    }

    // ── Relationships ──

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(SessionParticipant::class, 'participant_id');
    }

    public function splitBillItems(): HasMany
    {
        return $this->hasMany(SplitBillItem::class);
    }
}
