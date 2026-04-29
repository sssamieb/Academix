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
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('course_sections')->onDelete('cascade');
            $table->string('title');
            $table->enum('type', ['video', 'article']);
            $table->longText('content')->nullable();       // texto para artículos
            $table->string('video_url')->nullable();       // URL del video
            $table->unsignedInteger('duration')->nullable(); // duración en minutos
            $table->unsignedInteger('order')->default(0);
            $table->boolean('is_preview')->default(false); // si es parte del 10% de prueba
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('lessons');
    }
};
