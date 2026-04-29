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
        Schema::create('course_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('enrollment_id')->constrained()->onDelete('restrict');
            $table->unsignedTinyInteger('rating'); // 1 a 5
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']); // una reseña por estudiante por curso
        });
    }

    public function down(): void {
        Schema::dropIfExists('course_reviews');
    }
};
