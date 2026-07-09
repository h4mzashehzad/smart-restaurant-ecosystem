<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('table_sessions', function (Blueprint $table) {
            // Tracks overall payment completion for the session
            $table->enum('payment_status', ['unpaid', 'partial', 'paid'])
                  ->default('unpaid')
                  ->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('table_sessions', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });
    }
};