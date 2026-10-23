<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'menu_item_id',
        'quantity',
        'unit_price',
        'total_price',
        'customization_notes',
        'item_name', 'preparation_minutes', 'customization_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'customization_snapshot' => 'array',
            'preparation_minutes' => 'integer',
        ];
    }

    // ── Relationships ──

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function customizations(): HasMany
    {
        return $this->hasMany(OrderItemCustomization::class);
    }

    public function splitBillItems(): HasMany
    {
        return $this->hasMany(SplitBillItem::class);
    }
}
