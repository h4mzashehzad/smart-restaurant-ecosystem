<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'category_id',
        'name',
        'slug',
        'description',
        'base_price',
        'preparation_time',
        'spice_level',
        'cuisine_type',
        'calories',
        'is_vegetarian',
        'is_vegan',
        'is_gluten_free',
        'is_available',
        'is_signature',
        'image_url',
        'ar_model_url',
        'popularity_score',
        'total_orders',
        'average_rating',
        'review_count',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'preparation_time' => 'integer',
            'calories' => 'integer',
            'is_vegetarian' => 'boolean',
            'is_vegan' => 'boolean',
            'is_gluten_free' => 'boolean',
            'is_available' => 'boolean',
            'is_signature' => 'boolean',
            'popularity_score' => 'decimal:2',
            'total_orders' => 'integer',
            'average_rating' => 'decimal:2',
            'review_count' => 'integer',
        ];
    }

    /**
     * Recompute average_rating and review_count from feedback_menu_items.
     */
    public function recalculateAverageRating(): void
    {
        $query = FeedbackMenuItem::query()
            ->where('menu_item_id', $this->id)
            ->whereNotNull('item_rating');

        $count = (clone $query)->count();
        $avg = $count > 0 ? (clone $query)->avg('item_rating') : 0;

        $this->update([
            'average_rating' => round((float) $avg, 2),
            'review_count' => $count,
        ]);
    }

    // ── Relationships ──

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'menu_item_ingredients')
            ->using(MenuItemIngredient::class)
            ->withPivot(
                'quantity',
                'is_optional',
                'is_removable',
                'is_adjustable',
                'min_quantity',
                'max_quantity',
                'extra_unit_price',
                'additional_price'
            );
    }

    public function menuItemIngredients(): HasMany
    {
        return $this->hasMany(MenuItemIngredient::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function feedbackMenuItems(): HasMany
    {
        return $this->hasMany(FeedbackMenuItem::class);
    }

    public function aiRecommendations(): HasMany
    {
        return $this->hasMany(AiRecommendation::class);
    }

    public function demandForecasts(): HasMany
    {
        return $this->hasMany(DemandForecast::class);
    }
}
