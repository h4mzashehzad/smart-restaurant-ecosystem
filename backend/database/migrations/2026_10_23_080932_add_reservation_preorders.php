<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('restaurants', function (Blueprint $table): void {
            $table->string('timezone', 64)->default('Asia/Karachi');
        });
        Schema::table('reservations', function (Blueprint $table): void {
            $table->timestamp('arrival_at')->nullable()->index();
            $table->timestamp('cancellation_deadline')->nullable();
            $table->string('checkout_state', 24)->default('table_only')->index();
            $table->timestamp('checkout_expires_at')->nullable();
            $table->string('checkout_key', 64)->nullable()->unique();
            $table->unsignedTinyInteger('cancellation_fee_percent')->default(5);
            $table->string('cancelled_by', 24)->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamp('confirmation_sent_at')->nullable();
            $table->timestamp('cancellation_sent_at')->nullable();
        });
        DB::table('reservations')->orderBy('id')->chunkById(200, function ($rows): void {
            foreach ($rows as $row) {
                $arrival = CarbonImmutable::parse($row->reservation_date.' '.$row->reservation_time, 'Asia/Karachi')->utc();
                DB::table('reservations')->where('id', $row->id)->update([
                    'arrival_at' => $arrival,
                    'cancellation_deadline' => $arrival->subHours(2),
                    'confirmation_sent_at' => $row->created_at,
                    'cancellation_sent_at' => $row->status === 'cancelled' ? ($row->cancelled_at ?? $row->created_at) : null,
                ]);
            }
        });
        Schema::table('orders', function (Blueprint $table): void {
            $table->foreignId('reservation_id')->nullable()->unique()->constrained()->restrictOnDelete();
            $table->timestamp('kitchen_release_at')->nullable()->index();
            $table->timestamp('kitchen_released_at')->nullable();
            $table->timestamp('kitchen_notified_at')->nullable();
            $table->enum('order_type', ['dine_in', 'takeaway', 'reservation_preorder'])->default('dine_in')->change();
            $table->enum('status', ['pending_payment', 'scheduled', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'])->default('pending')->change();
        });
        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropForeign(['menu_item_id']);
            $table->foreignId('menu_item_id')->nullable()->change();
            $table->foreign('menu_item_id')->references('id')->on('menu_items')->nullOnDelete();
            $table->string('item_name')->nullable();
            $table->unsignedInteger('preparation_minutes')->nullable();
            $table->json('customization_snapshot')->nullable();
        });
        Schema::create('payment_refunds', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('payment_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('reservation_id')->constrained()->restrictOnDelete();
            $table->unsignedBigInteger('amount_paisa');
            $table->unsignedBigInteger('fee_paisa')->default(0);
            $table->string('status', 24)->default('pending')->index();
            $table->uuid('request_key')->unique();
            $table->json('gateway_response')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::table('orders')->whereNotNull('reservation_id')->exists()) {
            throw new RuntimeException('Cannot roll back while reservation preorder records exist.');
        }
        Schema::dropIfExists('payment_refunds');
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('reservation_id');
            $table->dropColumn(['kitchen_release_at', 'kitchen_released_at', 'kitchen_notified_at']);
            $table->enum('order_type', ['dine_in', 'takeaway'])->default('dine_in')->change();
            $table->enum('status', ['pending_payment', 'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'])->default('pending')->change();
        });
        Schema::table('order_items', fn (Blueprint $table) => $table->dropColumn(['item_name', 'preparation_minutes', 'customization_snapshot']));
        Schema::table('reservations', function (Blueprint $table): void {
            $table->dropUnique(['checkout_key']);
            $table->dropColumn(['arrival_at', 'cancellation_deadline', 'checkout_state', 'checkout_expires_at', 'checkout_key', 'cancellation_fee_percent', 'cancelled_by', 'cancellation_reason', 'confirmation_sent_at', 'cancellation_sent_at']);
        });
        Schema::table('restaurants', fn (Blueprint $table) => $table->dropColumn('timezone'));
    }
};
