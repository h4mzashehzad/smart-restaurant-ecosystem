<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // Safepay-specific fields
            $table->string('safepay_tracker_token', 255)->nullable()->after('transaction_id');
            $table->string('safepay_reference_code', 255)->nullable()->after('safepay_tracker_token');

            // Receipt stored in S3
            $table->string('receipt_url', 500)->nullable()->after('gateway_response');
            $table->string('receipt_s3_key', 500)->nullable()->after('receipt_url');

            // Atomic split-bill group identifier (all payments in the same split share this UUID)
            $table->uuid('split_group_id')->nullable()->after('payment_type');

            $table->index('safepay_tracker_token');
            $table->index('split_group_id');
        });

        // Change payment_method enum: drop old values, add cash + safepay
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('cash','safepay') NOT NULL");

        // Add 'voided' to payment status enum
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending','processing','completed','failed','refunded','voided') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['safepay_tracker_token']);
            $table->dropIndex(['split_group_id']);
            $table->dropColumn([
                'safepay_tracker_token',
                'safepay_reference_code',
                'receipt_url',
                'receipt_s3_key',
                'split_group_id',
            ]);
        });

        // Restore original enums
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('cash','card','jazzcash','easypaisa','bank_transfer') NOT NULL");
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending'");
    }
};