<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('service_requests', function (Blueprint $table): void {
            $table->enum('request_type', [
                'waiter_call', 'bill_request', 'water_refill', 'cutlery', 'complaint', 'other',
                'extra_naan_roti', 'extra_raita_salad',
            ])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('service_requests')
            ->whereIn('request_type', ['extra_naan_roti', 'extra_raita_salad'])
            ->update(['request_type' => 'other']);

        Schema::table('service_requests', function (Blueprint $table): void {
            $table->enum('request_type', [
                'waiter_call', 'bill_request', 'water_refill', 'cutlery', 'complaint', 'other',
            ])->change();
        });
    }
};
