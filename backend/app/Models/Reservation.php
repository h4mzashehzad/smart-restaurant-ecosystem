<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'user_id',
        'guest_name',
        'guest_phone',
        'guest_email',
        'party_size',
        'reservation_date',
        'reservation_time',
        'table_id',
        'status',
        'special_requests',
        'confirmation_code',
        'confirmed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'party_size' => 'integer',
            'reservation_date' => 'date',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    // ── Scopes ──

    public function scopeUpcoming($query)
    {
        return $query->where('reservation_date', '>=', today())
            ->whereNotIn('status', ['cancelled', 'completed', 'no_show']);
    }

    public function scopeForDate($query, string $date)
    {
        return $query->where('reservation_date', $date);
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['cancelled', 'completed', 'no_show']);
    }
}
