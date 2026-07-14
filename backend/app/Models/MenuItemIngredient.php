<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class MenuItemIngredient extends Pivot
{
    protected $table = 'menu_item_ingredients';

    public $incrementing = true;

    public $timestamps = false;

    protected $fillable = [
        'menu_item_id',
        'ingredient_id',
        'quantity',
        'is_optional',
        'is_removable',
        'is_adjustable',
        'min_quantity',
        'max_quantity',
        'extra_unit_price',
        'additional_price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'is_optional' => 'boolean',
            'is_removable' => 'boolean',
            'is_adjustable' => 'boolean',
            'min_quantity' => 'decimal:2',
            'max_quantity' => 'decimal:2',
            'extra_unit_price' => 'decimal:2',
            'additional_price' => 'decimal:2',
        ];
    }

    // ── Relationships ──

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
