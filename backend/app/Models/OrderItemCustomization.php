<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemCustomization extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_item_id',
        'ingredient_id',
        'action',
        'quantity',
        'price_adjustment',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'price_adjustment' => 'decimal:2',
        ];
    }

    // ── Relationships ──

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
