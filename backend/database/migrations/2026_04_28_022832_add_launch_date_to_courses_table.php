<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('courses', function (Blueprint $table) {
            $table->timestamp('launch_date')->nullable()->after('approved_at');
        });
    }

    public function down(): void {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('launch_date');
        });
    }
};
