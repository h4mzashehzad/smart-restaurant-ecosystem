<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->string('table_number', 20);
            $table->string('qr_code')->unique();
            $table->unsignedTinyInteger('capacity')->default(4);
            $table->enum('status', ['available', 'occupied', 'reserved', 'maintenance'])->default('available');
            $table->unsignedBigInteger('current_session_id')->nullable();
            $table->timestamps();

            $table->unique(['restaurant_id', 'table_number']);
            $table->index('qr_code');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
