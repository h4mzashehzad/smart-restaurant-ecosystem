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

        $driver = Schema::getConnection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE split_bill_items MODIFY payment_id BIGINT UNSIGNED NULL');

            $indexes = collect(DB::select("SHOW INDEX FROM split_bill_items WHERE Key_name = 'split_bill_items_order_item_unit_unique'"));
            if ($indexes->isEmpty()) {
                Schema::table('split_bill_items', function (Blueprint $table) {
                    $table->unique(['order_item_id', 'unit_index'], 'split_bill_items_order_item_unit_unique');
                });
            }

            return;
        }

        // SQLite: recreate-friendly nullable payment_id + unique index for schema parity in tests.
        if (Schema::hasColumn('split_bill_items', 'payment_id')) {
            Schema::table('split_bill_items', function (Blueprint $table) {
                $table->unsignedBigInteger('payment_id')->nullable()->change();
            });
        }

        $indexExists = collect(DB::select("PRAGMA index_list('split_bill_items')"))
            ->contains(fn ($row) => ($row->name ?? null) === 'split_bill_items_order_item_unit_unique');

        if (! $indexExists) {
            Schema::table('split_bill_items', function (Blueprint $table) {
                $table->unique(['order_item_id', 'unit_index'], 'split_bill_items_order_item_unit_unique');
            });
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        Schema::table('split_bill_items', function (Blueprint $table) use ($driver) {
            if (in_array($driver, ['mysql', 'mariadb'], true)) {
                $indexes = collect(DB::select("SHOW INDEX FROM split_bill_items WHERE Key_name = 'split_bill_items_order_item_unit_unique'"));
                if ($indexes->isNotEmpty()) {
                    $table->dropUnique('split_bill_items_order_item_unit_unique');
                }
            } else {
                try {
                    $table->dropUnique('split_bill_items_order_item_unit_unique');
                } catch (\Throwable) {
                    // Index may not exist on fresh sqlite down.
                }
            }

            if (Schema::hasColumn('split_bill_items', 'unit_index')) {
                $table->dropColumn('unit_index');
            }
        });

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            DB::statement('ALTER TABLE split_bill_items MODIFY payment_id BIGINT UNSIGNED NOT NULL');
        }
    }
};
