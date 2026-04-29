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
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('course_id')->constrained()->onDelete('restrict');
            $table->unsignedInteger('tokens_spent');
            $table->enum('status', [
                'trial',      // en el 10% de prueba
                'active',     // confirmó que quiere continuar
                'refunded',   // devolvió tokens y perdió acceso
                'completed',  // completó el curso
            ])->default('trial');
            $table->timestamp('trial_decision_at')->nullable(); // cuando se le preguntó si continúa
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('enrollments');
    }
};
