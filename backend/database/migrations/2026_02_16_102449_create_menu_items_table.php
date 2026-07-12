<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->string('name', 150);
            $table->string('slug', 150);
            $table->text('description')->nullable();
            $table->decimal('base_price', 10, 2);
            $table->unsignedInteger('preparation_time')->default(15)->comment('Minutes');
            $table->enum('spice_level', ['none', 'mild', 'medium', 'hot', 'extra_hot'])->default('none');
            $table->string('cuisine_type', 50)->nullable();
            $table->unsignedInteger('calories')->nullable();
            $table->boolean('is_vegetarian')->default(false);
            $table->boolean('is_vegan')->default(false);
            $table->boolean('is_gluten_free')->default(false);
            $table->boolean('is_available')->default(true);
            $table->boolean('is_signature')->default(false);
            $table->string('image_url', 500)->nullable();
            $table->string('ar_model_url', 500)->nullable();
            $table->decimal('popularity_score', 5, 2)->default(0.00);
            $table->unsignedInteger('total_orders')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->timestamps();

            $table->index(['restaurant_id', 'is_available']);
            $table->index('category_id');
            $table->index(['popularity_score']);
            $table->index('is_signature');

            if (Schema::getConnection()->getDriverName() !== 'sqlite') {
                $table->fullText(['name', 'description']);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
