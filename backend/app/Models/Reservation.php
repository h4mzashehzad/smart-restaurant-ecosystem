<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'arrival_at', 'cancellation_deadline', 'checkout_state', 'checkout_expires_at',
        'checkout_key', 'cancellation_fee_percent', 'cancelled_by', 'cancellation_reason', 'confirmation_sent_at', 'cancellation_sent_at',
    ];

    protected $hidden = ['checkout_key'];

    protected static function booted(): void
    {
        static::creating(function (Reservation $reservation): void {
            if (! $reservation->arrival_at) {
                $reservation->arrival_at = \Carbon\CarbonImmutable::parse($reservation->reservation_date->format('Y-m-d').' '.$reservation->reservation_time,
                    $reservation->restaurant?->timezone ?: config('reservations.default_timezone'))->utc();
            }
            $reservation->cancellation_deadline ??= $reservation->arrival_at->subHours(config('reservations.cancellation_hours'));
        });
    }

    public function managementToken(): string
    {
        return hash_hmac('sha256', 'reservation:'.$this->id.':'.$this->confirmation_code, config('app.key'));
    }

    public function managementUrl(): string
    {
        return rtrim(config('app.frontend_url'), '/').'/reservations/'.$this->confirmation_code.'?token='.$this->managementToken();
    }

    public function preorder(): HasOne
    {
        return $this->hasOne(Order::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(PaymentRefund::class);
    }

    protected function casts(): array
    {
        return [
            'party_size' => 'integer',
            'reservation_date' => 'date',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'arrival_at' => 'immutable_datetime',
            'cancellation_deadline' => 'immutable_datetime',
            'checkout_expires_at' => 'immutable_datetime',
            'confirmation_sent_at' => 'datetime',
            'cancellation_sent_at' => 'datetime',
            'cancellation_fee_percent' => 'integer',
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
        return $query->whereNotIn('status', ['cancelled', 'completed', 'no_show'])
            ->where(fn ($q) => $q->whereIn('checkout_state', ['table_only', 'paid'])
                ->orWhere(fn ($hold) => $hold->where('checkout_state', 'pending')->where('checkout_expires_at', '>', now())));
    }
}
