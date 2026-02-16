<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableSession extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'table_id',
        'restaurant_id',
        'session_token',
        'started_at',
        'ended_at',
        'total_amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'total_amount' => 'decimal:2',
        ];
    }

    // ── Relationships ──

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function participants(): HasMany
    {
        return $this->hasMany(SessionParticipant::class, 'session_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'session_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'session_id');
    }

    public function aiRecommendations(): HasMany
    {
        return $this->hasMany(AiRecommendation::class, 'session_id');
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'session_id');
    }

    public function analyticsEvents(): HasMany
    {
        return $this->hasMany(AnalyticsEvent::class, 'session_id');
    }
}
