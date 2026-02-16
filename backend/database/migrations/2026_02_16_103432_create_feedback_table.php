<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->unsignedTinyInteger('rating')->comment('Range: 1-5');
            $table->text('review_text')->nullable();
            $table->decimal('sentiment_score', 5, 4)->nullable()->comment('Range: -1 (negative) to +1 (positive)');
            $table->enum('sentiment_label', ['positive', 'neutral', 'negative'])->nullable();
            $table->decimal('sentiment_confidence', 5, 4)->nullable();
            $table->boolean('is_flagged')->default(false);
            $table->string('flagged_reason')->nullable();
            $table->text('admin_response')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['restaurant_id', 'sentiment_label']);
            $table->index('is_flagged');
            $table->index('rating');
            $table->fullText('review_text');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
