<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback_menu_items', function (Blueprint $table) {
            $table->text('item_review_text')->nullable()->after('item_rating');
            $table->decimal('item_sentiment_score', 5, 4)->nullable()->after('item_review_text');
            $table->enum('item_sentiment_label', ['positive', 'neutral', 'negative'])->nullable()->after('item_sentiment_score');
            $table->boolean('item_is_flagged')->default(false)->after('item_sentiment_label');
        });
    }

    public function down(): void
    {
        Schema::table('feedback_menu_items', function (Blueprint $table) {
            $table->dropColumn([
                'item_review_text',
                'item_sentiment_score',
                'item_sentiment_label',
                'item_is_flagged',
            ]);
        });
    }
};
