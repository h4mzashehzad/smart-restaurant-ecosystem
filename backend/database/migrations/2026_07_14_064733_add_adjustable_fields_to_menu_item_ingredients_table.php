<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_item_ingredients', function (Blueprint $table) {
            $table->boolean('is_adjustable')->default(false)->after('is_removable');
            $table->decimal('min_quantity', 10, 2)->default(0)->after('is_adjustable');
            $table->decimal('max_quantity', 10, 2)->nullable()->after('min_quantity');
            $table->decimal('extra_unit_price', 10, 2)->default(0.00)->after('max_quantity');
        });
    }

    public function down(): void
    {
        Schema::table('menu_item_ingredients', function (Blueprint $table) {
            $table->dropColumn([
                'is_adjustable',
                'min_quantity',
                'max_quantity',
                'extra_unit_price',
            ]);
        });
    }
};
