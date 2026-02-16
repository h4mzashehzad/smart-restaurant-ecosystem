<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('split_bill_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('participant_id')->constrained('session_participants')->onDelete('cascade');
            $table->decimal('amount', 10, 2);

            $table->index('payment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('split_bill_items');
    }
};
