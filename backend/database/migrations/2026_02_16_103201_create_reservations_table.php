<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('guest_name', 100);
            $table->string('guest_phone', 20);
            $table->string('guest_email', 150)->nullable();
            $table->unsignedTinyInteger('party_size');
            $table->date('reservation_date');
            $table->time('reservation_time');
            $table->foreignId('table_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('status', ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'])->default('pending');
            $table->text('special_requests')->nullable();
            $table->string('confirmation_code', 20)->unique();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'reservation_date']);
            $table->index('status');
            $table->index('confirmation_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
