<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentRefund extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['gateway_response', 'request_key'];

    protected function casts(): array
    {
        return ['gateway_response' => 'array', 'submitted_at' => 'datetime', 'completed_at' => 'datetime', 'notified_at' => 'datetime', 'amount_paisa' => 'integer', 'fee_paisa' => 'integer'];
    }

    public function payment(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function reservation(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
