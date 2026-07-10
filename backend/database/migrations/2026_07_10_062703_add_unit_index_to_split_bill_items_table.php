<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('split_bill_items', 'unit_index')) {
            Schema::table('split_bill_items', function (Blueprint $table) {
                $table->unsignedInteger('unit_index')->default(0)->after('order_item_id');
            });
        }

        DB::statement('ALTER TABLE split_bill_items MODIFY payment_id BIGINT UNSIGNED NULL');

        $indexes = collect(DB::select("SHOW INDEX FROM split_bill_items WHERE Key_name = 'split_bill_items_order_item_unit_unique'"));
        if ($indexes->isEmpty()) {
            Schema::table('split_bill_items', function (Blueprint $table) {
                $table->unique(['order_item_id', 'unit_index'], 'split_bill_items_order_item_unit_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::table('split_bill_items', function (Blueprint $table) {
            $indexes = collect(DB::select("SHOW INDEX FROM split_bill_items WHERE Key_name = 'split_bill_items_order_item_unit_unique'"));
            if ($indexes->isNotEmpty()) {
                $table->dropUnique('split_bill_items_order_item_unit_unique');
            }
            if (Schema::hasColumn('split_bill_items', 'unit_index')) {
                $table->dropColumn('unit_index');
            }
        });

        DB::statement('ALTER TABLE split_bill_items MODIFY payment_id BIGINT UNSIGNED NOT NULL');
    }
};
