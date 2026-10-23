<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $appends = ['estimated_completion_at'];

    protected $fillable = [
        'restaurant_id',
        'reservation_id', 'kitchen_release_at', 'kitchen_released_at', 'kitchen_notified_at',
        'table_id',
        'session_id',
        'user_id',
        'order_number',
        'order_type',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'status',
        'special_instructions',
        'placed_at',
        'confirmed_at',
        'ready_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'placed_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
            'kitchen_release_at' => 'datetime',
            'kitchen_released_at' => 'datetime',
            'kitchen_notified_at' => 'datetime',
        ];
    }

    // ── Accessors ──

    public function getEstimatedCompletionAtAttribute()
    {
        if ($this->reservation_id) {
            return $this->reservation?->arrival_at;
        }
        $maxPrep = $this->items->max(fn ($item) => $item->menuItem?->preparation_time ?? 0);

        return $this->placed_at?->addMinutes($maxPrep ?: 15);
    }

    // ── Relationships ──

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    public function loyaltyTransactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class);
    }
}
