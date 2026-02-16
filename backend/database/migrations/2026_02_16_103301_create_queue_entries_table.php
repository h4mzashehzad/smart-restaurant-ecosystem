<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('queue_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('guest_name', 100);
            $table->string('guest_phone', 20);
            $table->unsignedTinyInteger('party_size');
            $table->unsignedInteger('queue_number');
            $table->unsignedInteger('estimated_wait_time')->nullable()->comment('Minutes');
            $table->enum('status', ['waiting', 'called', 'seated', 'cancelled', 'no_show'])->default('waiting');
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('seated_at')->nullable();

            $table->index(['restaurant_id', 'status']);
            $table->index('queue_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('queue_entries');
    }
};
