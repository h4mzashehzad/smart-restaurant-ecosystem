<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (! Schema::hasColumn('payments', 'safepay_tracker_token')) {
                $table->string('safepay_tracker_token', 255)->nullable()->after('transaction_id');
            }
            if (! Schema::hasColumn('payments', 'safepay_reference_code')) {
                $table->string('safepay_reference_code', 255)->nullable()->after('safepay_tracker_token');
            }
            if (! Schema::hasColumn('payments', 'receipt_url')) {
                $table->string('receipt_url', 500)->nullable()->after('gateway_response');
            }
            if (! Schema::hasColumn('payments', 'receipt_s3_key')) {
                $table->string('receipt_s3_key', 500)->nullable()->after('receipt_url');
            }
            if (! Schema::hasColumn('payments', 'split_group_id')) {
                $table->uuid('split_group_id')->nullable()->after('payment_type');
                $table->index('split_group_id');
            }
            if (! Schema::hasColumn('payments', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('paid_at');
            }
        });

        if (Schema::hasColumn('payments', 'safepay_tracker_token')) {
            $indexes = collect(DB::select("SHOW INDEX FROM payments WHERE Key_name = 'payments_safepay_tracker_token_index'"));
            if ($indexes->isEmpty()) {
                Schema::table('payments', function (Blueprint $table) {
                    $table->index('safepay_tracker_token');
                });
            }
        }

        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('cash', 'safepay', 'card', 'jazzcash', 'easypaisa', 'bank_transfer') NOT NULL");
        DB::statement("UPDATE payments SET payment_method = 'safepay' WHERE payment_method IN ('card', 'jazzcash', 'easypaisa', 'bank_transfer')");
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('cash', 'safepay') NOT NULL");
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'voided', 'expired') NOT NULL DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("UPDATE payments SET payment_method = 'card' WHERE payment_method = 'safepay'");
        DB::statement("ALTER TABLE payments MODIFY COLUMN payment_method ENUM('cash', 'card', 'jazzcash', 'easypaisa', 'bank_transfer') NOT NULL");
        DB::statement("UPDATE payments SET status = 'failed' WHERE status IN ('voided', 'expired')");
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending'");

        Schema::table('payments', function (Blueprint $table) {
            $drop = [];
            foreach (['expires_at', 'receipt_s3_key', 'receipt_url', 'safepay_reference_code', 'safepay_tracker_token', 'split_group_id'] as $col) {
                if (Schema::hasColumn('payments', $col)) {
                    $drop[] = $col;
                }
            }
            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }
};
