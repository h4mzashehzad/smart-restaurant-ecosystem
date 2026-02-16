<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyReward extends Model
{
    use HasFactory;

    protected $fillable = [
        'tier',
        'reward_type',
        'reward_value',
        'description',
        'minimum_points',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'reward_value' => 'decimal:2',
            'minimum_points' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
