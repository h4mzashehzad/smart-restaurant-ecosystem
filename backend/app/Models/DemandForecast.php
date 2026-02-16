<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DemandForecast extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'restaurant_id',
        'menu_item_id',
        'forecast_date',
        'hour_of_day',
        'predicted_quantity',
        'confidence_score',
        'actual_quantity',
    ];

    protected function casts(): array
    {
        return [
            'forecast_date' => 'date',
            'hour_of_day' => 'integer',
            'predicted_quantity' => 'integer',
            'confidence_score' => 'decimal:4',
            'actual_quantity' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
