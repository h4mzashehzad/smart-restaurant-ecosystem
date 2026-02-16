<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('session_id')->nullable()->constrained('table_sessions')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('participant_id')->nullable()->constrained('session_participants')->onDelete('set null');
            $table->enum('payment_method', ['cash', 'card', 'jazzcash', 'easypaisa', 'bank_transfer']);
            $table->enum('payment_type', ['full', 'split_equal', 'split_itemized'])->default('full');
            $table->decimal('amount', 10, 2);
            $table->string('transaction_id', 100)->unique()->nullable();
            $table->json('gateway_response')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index('transaction_id');
            $table->index('status');
            $table->index(['session_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
