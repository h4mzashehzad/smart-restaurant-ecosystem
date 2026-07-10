<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending_payment', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'");
    }
};
