<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Add 'pending_payment' to orders.status enum.
     *
     * Orders that have been submitted but are waiting for payment confirmation
     * (e.g. cash payments awaiting staff confirmation) use this status.
     * The KDS does NOT display pending_payment orders - they only appear
     * in the kitchen queue once confirmed.
     */
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE orders MODIFY COLUMN status ENUM(
                'pending_payment',
                'pending',
                'confirmed',
                'preparing',
                'ready',
                'served',
                'completed',
                'cancelled'
            ) NOT NULL DEFAULT 'pending'"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE orders MODIFY COLUMN status ENUM(
                'pending',
                'confirmed',
                'preparing',
                'ready',
                'served',
                'completed',
                'cancelled'
            ) NOT NULL DEFAULT 'pending'"
        );
    }
};