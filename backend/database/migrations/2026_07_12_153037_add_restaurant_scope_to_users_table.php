<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('restaurant_id')
                ->nullable()
                ->after('role')
                ->constrained('restaurants')
                ->nullOnDelete();
            $table->boolean('is_active')->default(true)->after('restaurant_id');
            $table->index(['restaurant_id', 'role']);
        });

        $restaurantId = DB::table('restaurants')->orderBy('id')->value('id');

        if ($restaurantId) {
            DB::table('users')
                ->whereIn('role', ['admin', 'staff'])
                ->whereNull('restaurant_id')
                ->update(['restaurant_id' => $restaurantId]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('restaurant_id');
            $table->dropColumn('is_active');
        });
    }
};
