<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('lessons', function (Blueprint $table) {
            // Cambiamos type a nullable porque ahora una lección puede tener ambos
            $table->string('video_url')->nullable()->change();
            $table->longText('article_content')->nullable()->after('video_url');
            // type ahora indica qué tiene: 'video', 'article', 'both'
            $table->dropColumn('type');
        });

        Schema::table('lessons', function (Blueprint $table) {
            $table->enum('type', ['video', 'article', 'both'])->default('both')->after('title');
        });
    }

    public function down(): void {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn('article_content');
            $table->dropColumn('type');
        });
        Schema::table('lessons', function (Blueprint $table) {
            $table->enum('type', ['video', 'article'])->after('title');
        });
    }
};