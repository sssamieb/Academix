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
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('course_id')->constrained()->onDelete('restrict');
            $table->foreignId('enrollment_id')->constrained()->onDelete('restrict');
            $table->string('certificate_code')->unique(); // código único de verificación
            $table->timestamp('issued_at');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('certificates');
    }
};
