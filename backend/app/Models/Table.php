<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Table extends Model
{
    use HasFactory;

    protected $fillable = [
        'restaurant_id',
        'table_number',
        'qr_code',
        'qr_code_url',
        'capacity',
        'status',
        'current_session_id',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
        ];
    }

    // ── Relationships ──

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function currentSession(): BelongsTo
    {
        return $this->belongsTo(TableSession::class, 'current_session_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TableSession::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }
}
