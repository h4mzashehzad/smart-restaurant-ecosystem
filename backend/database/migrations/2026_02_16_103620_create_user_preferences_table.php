<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('preference_type', ['cuisine', 'spice_level', 'dietary', 'price_range', 'category']);
            $table->string('preference_value', 100);
            $table->decimal('weight', 3, 2)->default(1.00);
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['user_id', 'preference_type', 'preference_value']);
            $table->index(['user_id', 'preference_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
