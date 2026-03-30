<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('session_participants', function (Blueprint $table) {
            $table->boolean('is_host')->default(false)->after('device_id');
        });
    }

    public function down(): void
    {
        Schema::table('session_participants', function (Blueprint $table) {
            $table->dropColumn('is_host');
        });
    }
};
