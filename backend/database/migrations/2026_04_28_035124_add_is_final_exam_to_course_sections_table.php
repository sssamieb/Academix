<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void {
        Schema::table('course_sections', function (Blueprint $table) {
            $table->boolean('is_final_exam')->default(false)->after('is_presentation');
        });
    }

    public function down(): void {
        Schema::table('course_sections', function (Blueprint $table) {
            $table->dropColumn('is_final_exam');
        });
    }
    };
