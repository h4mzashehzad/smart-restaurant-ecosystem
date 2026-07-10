<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('table_sessions', 'payment_status')) {
            Schema::table('table_sessions', function (Blueprint $table) {
                $table->enum('payment_status', ['unpaid', 'partial', 'paid'])->default('unpaid')->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('table_sessions', 'payment_status')) {
            Schema::table('table_sessions', function (Blueprint $table) {
                $table->dropColumn('payment_status');
            });
        }
    }
};
