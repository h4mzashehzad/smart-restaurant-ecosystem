<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'name',
        'unit',
        'cost_per_unit',
        'stock_quantity',
        'minimum_threshold',
        'is_allergen',
        'allergen_type',
    ];

    protected function casts(): array
    {
        return [
            'cost_per_unit' => 'decimal:2',
            'stock_quantity' => 'decimal:2',
            'minimum_threshold' => 'decimal:2',
            'is_allergen' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function menuItems(): BelongsToMany
    {
        return $this->belongsToMany(MenuItem::class, 'menu_item_ingredients')
            ->using(MenuItemIngredient::class)
            ->withPivot('quantity', 'is_optional', 'is_removable', 'additional_price');
    }

    public function menuItemIngredients(): HasMany
    {
        return $this->hasMany(MenuItemIngredient::class);
    }

    public function orderItemCustomizations(): HasMany
    {
        return $this->hasMany(OrderItemCustomization::class);
    }
}
