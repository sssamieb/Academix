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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('price', 8, 2);
            $table->string('period')->default('mes');
            $table->string('type')->unique();
            $table->unsignedInteger('monthly_tokens');
            $table->boolean('tokens_accumulate')->default(false);
            $table->boolean('unlimited_tokens')->default(false);
            $table->unsignedInteger('quiz_attempts');
            $table->unsignedInteger('exam_attempts');
            $table->boolean('unlimited_attempts')->default(false);
            $table->boolean('early_access')->default(false);
            $table->boolean('state_certificate')->default(false);
            $table->boolean('featured_profile')->default(false);
            $table->boolean('instructor_consultation')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('plans');
    }
};
