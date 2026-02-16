<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('name', 100);
            $table->string('unit', 20)->default('piece');
            $table->decimal('cost_per_unit', 10, 2)->default(0.00);
            $table->decimal('stock_quantity', 10, 2)->default(0.00);
            $table->decimal('minimum_threshold', 10, 2)->default(0.00);
            $table->boolean('is_allergen')->default(false);
            $table->string('allergen_type', 50)->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'name']);
            $table->index('stock_quantity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
