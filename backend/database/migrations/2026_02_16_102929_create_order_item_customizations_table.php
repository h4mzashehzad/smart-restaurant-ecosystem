<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_item_customizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('ingredient_id')->constrained()->onDelete('cascade');
            $table->enum('action', ['add', 'remove', 'modify']);
            $table->decimal('quantity', 10, 2)->default(1.00);
            $table->decimal('price_adjustment', 10, 2)->default(0.00);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_item_customizations');
    }
};
