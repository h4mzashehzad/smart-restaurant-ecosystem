<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtpVerification extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'phone',
        'otp_code',
        'expires_at',
        'verified',
        'attempts',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'verified' => 'boolean',
            'attempts' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
