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
        Schema::table('menu_items', function (Blueprint $table) {
            $table->unsignedInteger('review_count')->default(0)->after('average_rating');
        });

        // Backfill averages and counts from existing per-item feedback ratings.
        $aggregates = DB::table('feedback_menu_items')
            ->select(
                'menu_item_id',
                DB::raw('AVG(item_rating) as avg_rating'),
                DB::raw('COUNT(*) as review_count')
            )
            ->whereNotNull('item_rating')
            ->groupBy('menu_item_id')
            ->get();

        foreach ($aggregates as $row) {
            DB::table('menu_items')
                ->where('id', $row->menu_item_id)
                ->update([
                    'average_rating' => round((float) $row->avg_rating, 2),
                    'review_count' => (int) $row->review_count,
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn('review_count');
        });
    }
};
