<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback_menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feedback_id')->constrained()->onDelete('cascade');
            $table->foreignId('menu_item_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('item_rating')->nullable()->comment('Range: 1-5');

            $table->unique(['feedback_id', 'menu_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_menu_items');
    }
};
