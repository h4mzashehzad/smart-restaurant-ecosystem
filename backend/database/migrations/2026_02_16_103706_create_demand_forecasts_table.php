<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demand_forecasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('menu_item_id')->nullable()->constrained()->onDelete('cascade');
            $table->date('forecast_date');
            $table->unsignedTinyInteger('hour_of_day')->comment('Range: 0-23');
            $table->unsignedInteger('predicted_quantity');
            $table->decimal('confidence_score', 5, 4)->nullable();
            $table->unsignedInteger('actual_quantity')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Explicitly naming the unique index to keep it under 64 chars
            $table->unique(
                ['restaurant_id', 'menu_item_id', 'forecast_date', 'hour_of_day'], 
                'df_restaurant_menu_date_hour_unique'
            );

            // Explicitly naming the index as well (good practice for consistency)
            $table->index(
                ['restaurant_id', 'forecast_date'], 
                'df_restaurant_date_index'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demand_forecasts');
    }
};
