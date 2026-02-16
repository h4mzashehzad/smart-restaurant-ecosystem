<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_rewards', function (Blueprint $table) {
            $table->id();
            $table->enum('tier', ['bronze', 'silver', 'gold']);
            $table->enum('reward_type', ['discount_percentage', 'discount_fixed', 'free_item', 'priority_seating']);
            $table->decimal('reward_value', 10, 2);
            $table->string('description');
            $table->unsignedInteger('minimum_points')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tier', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_rewards');
    }
};
