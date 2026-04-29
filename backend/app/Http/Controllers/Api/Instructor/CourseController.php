<?php

namespace App\Http\Controllers\Api\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\CourseSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Quiz;

class CourseController extends Controller
{
    // Listar cursos del instructor
    public function index(Request $request): JsonResponse
    {
        $courses = Course::where('instructor_id', $request->user()->id)
            ->with('category')
            ->withCount('enrollments')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['courses' => $courses]);
    }

    // Crear curso
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'             => 'required|string|max:255',
            'short_description' => 'required|string|max:500',
            'category_id'       => 'required|exists:course_categories,id',
            'level'             => 'required|in:basico,intermedio,avanzado',
        ]);

        $course = Course::create([
            'instructor_id'     => $request->user()->id,
            'title'             => $request->title,
            'slug'              => Str::slug($request->title) . '-' . Str::random(6),
            'short_description' => $request->short_description,
            'description'       => '',
            'category_id'       => $request->category_id,
            'level'             => $request->level,
            'status'            => 'draft',
        ]);

        // ===== SECCIÓN 0: PRESENTACIÓN =====
        $templateContent = '
<h1>' . e($request->title) . '</h1>
<p><em>Imagen del curso — hacé click aquí para reemplazar</em></p>
<h2>Descripción del curso</h2>
<p>Escribí aquí una descripción general del curso.</p>
<h2>¿Qué vas a aprender?</h2>
<ul>
  <li>Objetivo 1</li>
  <li>Objetivo 2</li>
  <li>Objetivo 3</li>
</ul>
<h2>Requisitos previos</h2>
<ul>
  <li>Conocimiento básico de...</li>
</ul>
<h2>¿A quién está dirigido?</h2>
<p>Este curso está pensado para...</p>
<h2>Docente</h2>
<p>Nombre del instructor — breve descripción.</p>
';

        $course->sections()->create([
            'title'                => 'Presentación del curso',
            'order'                => 0,
            'is_presentation'      => true,
            'is_final_exam'        => false,
            'presentation_content' => $templateContent,
        ]);

        // ===== SECCIONES 1-5 CON LECCIÓN Y QUIZ =====
        for ($i = 1; $i <= 5; $i++) {
            $section = $course->sections()->create([
                'title'           => "Sección $i",
                'order'           => $i,
                'is_presentation' => false,
                'is_final_exam'   => false,
            ]);

            $lesson = $section->lessons()->create([
                'title'           => 'Lección 1',
                'type'            => 'video',
                'video_url'       => null,
                'article_content' => null,
                'order'           => 0,
                'is_preview'      => $i === 1,
            ]);

            $quiz = Quiz::create([
                'lesson_id'          => $lesson->id,
                'course_id'          => $course->id,
                'type'               => 'practice',
                'title'              => "Quiz - Sección $i",
                'passing_score'      => 70,
                'time_limit_minutes' => 5,
            ]);

            $question = $quiz->questions()->create([
                'question' => '¿Pregunta de ejemplo?',
                'order'    => 0,
            ]);

            $question->options()->createMany([
                ['option_text' => 'Opción A', 'is_correct' => true],
                ['option_text' => 'Opción B', 'is_correct' => false],
                ['option_text' => 'Opción C', 'is_correct' => false],
                ['option_text' => 'Opción D', 'is_correct' => false],
            ]);
        }

        // ===== SECCIÓN FINAL: EXAMEN =====
        $course->sections()->create([
            'title'           => 'Examen final',
            'order'           => 6,
            'is_presentation' => false,
            'is_final_exam'   => true,
        ]);

        Quiz::create([
            'lesson_id'          => null,
            'course_id'          => $course->id,
            'type'               => 'exam',
            'title'              => 'Examen final',
            'passing_score'      => 70,
            'time_limit_minutes' => 60,
        ]);

        return response()->json([
            'message' => 'Curso creado exitosamente.',
            'course'  => $course->load('category'),
        ], 201);
    }

    // Ver un curso
    public function show(Request $request, Course $course): JsonResponse
    {
        $this->authorizeInstructor($request, $course);

        return response()->json([
            'course' => $course->load([
                'category',
                'sections'                        => fn($q) => $q->orderBy('order'),
                'sections.lessons'                => fn($q) => $q->orderBy('order'),
                'sections.lessons.quiz.questions.options',
            ]),
        ]);
    }

    // Editar curso
    public function update(Request $request, Course $course): JsonResponse
    {
        $this->authorizeInstructor($request, $course);

        if (!in_array($course->status, ['draft', 'rejected'])) {
            return response()->json([
                'message' => 'Solo podés editar cursos en borrador o rechazados.',
            ], 403);
        }

        $request->validate([
            'title'             => 'sometimes|string|max:255',
            'short_description' => 'sometimes|string|max:500',
            'description'       => 'sometimes|string',
            'category_id'       => 'sometimes|exists:course_categories,id',
            'level'             => 'sometimes|in:basico,intermedio,avanzado',
            'thumbnail'         => 'sometimes|string|nullable',
        ]);

        $course->update($request->only([
            'title', 'short_description', 'description',
            'category_id', 'level', 'thumbnail',
        ]));

        return response()->json([
            'message' => 'Curso actualizado.',
            'course'  => $course->load('category'),
        ]);
    }

    // Mandar a revisión
    public function submitForReview(Request $request, Course $course): JsonResponse
    {
        $this->authorizeInstructor($request, $course);

        if (!in_array($course->status, ['draft', 'rejected'])) {
            return response()->json([
                'message' => 'El curso ya fue enviado o está publicado.',
            ], 403);
        }

        if ($course->sections()->where('is_presentation', false)->where('is_final_exam', false)->count() === 0) {
            return response()->json([
                'message' => 'El curso debe tener al menos una sección con lecciones.',
            ], 422);
        }

        $course->update([
            'status'       => 'in_review',
            'submitted_at' => now(),
        ]);

        return response()->json([
            'message' => 'Curso enviado a revisión exitosamente.',
        ]);
    }

    // Vista previa
    public function preview(Request $request, Course $course): JsonResponse
    {
        $this->authorizeInstructor($request, $course);

        return response()->json([
            'course' => $course->load([
                'category',
                'sections'         => fn($q) => $q->orderBy('order'),
                'sections.lessons' => fn($q) => $q->orderBy('order'),
                'sections.lessons.quiz.questions.options',
            ]),
        ]);
    }

    // Eliminar curso (solo borradores)
    public function destroy(Request $request, Course $course): JsonResponse
    {
        $this->authorizeInstructor($request, $course);

        if ($course->status !== 'draft') {
            return response()->json([
                'message' => 'Solo podés eliminar cursos en borrador.',
            ], 403);
        }

        $course->delete();

        return response()->json([
            'message' => 'Curso eliminado correctamente.',
        ]);
    }

    // Listar categorías
    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => CourseCategory::all(),
        ]);
    }

    private function authorizeInstructor(Request $request, Course $course): void
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403, 'No tenés permiso para acceder a este curso.');
        }
    }
}