<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SplitBillItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'payment_id',
        'order_item_id',
        'unit_index',
        'participant_id',
        'amount',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'unit_index' => 'integer',
        ];
    }

    // ── Relationships ──

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(SessionParticipant::class, 'participant_id');
    }
}
