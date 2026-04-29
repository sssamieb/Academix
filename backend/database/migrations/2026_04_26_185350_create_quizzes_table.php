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
        Schema::create('quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lesson_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('course_id')->nullable()->constrained()->onDelete('cascade');
            $table->enum('type', ['practice', 'exam']); // practice = quiz de lección, exam = examen final
            $table->string('title');
            $table->unsignedInteger('passing_score')->default(70); // % mínimo para aprobar
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('quizzes');
    }
};
