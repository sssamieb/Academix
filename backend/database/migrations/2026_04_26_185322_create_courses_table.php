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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instructor_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('category_id')->constrained('course_categories')->onDelete('restrict');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('short_description');
            $table->longText('description');
            $table->string('thumbnail')->nullable();
            $table->enum('level', ['basico', 'intermedio', 'avanzado']);
            $table->enum('status', ['draft', 'in_review', 'rejected', 'published', 'unpublished'])->default('draft');
            $table->unsignedInteger('token_price')->nullable(); // lo asigna el admin
            $table->text('rejection_reason')->nullable();       // motivo de rechazo
            $table->timestamp('submitted_at')->nullable();      // cuando mandó a revisión
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('courses');
    }
};
