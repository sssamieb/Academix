<?php

namespace Database\Seeders;

use App\Models\CourseCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CourseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Desarrollo Web',          'icon' => 'bi-globe'],
            ['name' => 'Apps Móviles',             'icon' => 'bi-phone-fill'],
            ['name' => 'Inteligencia Artificial',  'icon' => 'bi-cpu-fill'],
            ['name' => 'Diseño UX/UI',             'icon' => 'bi-palette-fill'],
            ['name' => 'Data Science',             'icon' => 'bi-graph-up'],
            ['name' => 'Ciberseguridad',           'icon' => 'bi-shield-lock-fill'],
            ['name' => 'DevOps',                   'icon' => 'bi-box-seam'],
            ['name' => 'Base de datos',            'icon' => 'bi-database-fill'],
            ['name' => 'Programación',             'icon' => 'bi-code-slash'],
            ['name' => 'Redes',                    'icon' => 'bi-router-fill'],
            ['name' => 'Marketing Digital',        'icon' => 'bi-megaphone-fill'],
            ['name' => 'Negocios',                 'icon' => 'bi-briefcase-fill'],
            ['name' => 'Diseño Gráfico',           'icon' => 'bi-brush-fill'],
            ['name' => 'Fotografía y Video',       'icon' => 'bi-camera-video-fill'],
            ['name' => 'Idiomas',                  'icon' => 'bi-translate'],
            ['name' => 'Finanzas',                 'icon' => 'bi-cash-coin'],
            ['name' => 'Productividad',            'icon' => 'bi-lightning-fill'],
            ['name' => 'Música',                   'icon' => 'bi-music-note-beamed'],
        ];

        foreach ($categories as $cat) {
            CourseCategory::firstOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'icon' => $cat['icon'],
                ]
            );
        }
    }
}