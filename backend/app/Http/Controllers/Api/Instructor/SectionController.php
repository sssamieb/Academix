<?php

namespace App\Http\Controllers\Api\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    // Actualizar título o contenido de presentación
    public function update(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->authorize($request, $course);

        if (!in_array($course->status, ['draft', 'rejected'])) {
            return response()->json(['message' => 'Solo podés editar cursos en borrador o rechazados.'], 403);
        }

        $request->validate([
            'title'                => 'sometimes|string|max:255',
            'presentation_content' => 'sometimes|nullable|string',
        ]);

        $section->update($request->only(['title', 'presentation_content']));

        return response()->json(['message' => 'Sección actualizada.', 'section' => $section]);
    }

    // Agregar sección
    public function store(Request $request, Course $course): JsonResponse
    {
        $this->authorize($request, $course);

        if (!in_array($course->status, ['draft', 'rejected'])) {
            return response()->json(['message' => 'Solo podés editar cursos en borrador o rechazados.'], 403);
        }

        $request->validate(['title' => 'required|string|max:255']);

        // Insertar antes del examen final (último)
        $lastOrder = $course->sections()->max('order');

        // Mover el examen final un lugar más
        $course->sections()
            ->where('order', $lastOrder)
            ->update(['order' => $lastOrder + 1]);

        $section = $course->sections()->create([
            'title'           => $request->title,
            'order'           => $lastOrder,
            'is_presentation' => false,
        ]);

        // Lección predeterminada
        $lesson = $section->lessons()->create([
            'title'           => 'Lección 1',
            'type'            => 'video',
            'video_url'       => null,
            'article_content' => null,
            'order'           => 0,
            'is_preview'      => false,
        ]);

        \App\Models\Quiz::create([
            'lesson_id'     => $lesson->id,
            'course_id'     => $course->id,
            'type'          => 'practice',
            'title'         => 'Quiz - ' . $request->title,
            'passing_score' => 70,
        ]);

        return response()->json([
            'message' => 'Sección agregada.',
            'section' => $section->load('lessons.quiz.questions.options'),
        ], 201);
    }

    // Eliminar sección
    public function destroy(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->authorize($request, $course);

        if (!in_array($course->status, ['draft', 'rejected'])) {
            return response()->json(['message' => 'Solo podés editar cursos en borrador o rechazados.'], 403);
        }

        if ($section->is_presentation) {
            return response()->json(['message' => 'No podés eliminar la sección de presentación.'], 403);
        }

        // Verificar que no sea la última sección de contenido ni el examen
        $contentSections = $course->sections()
            ->where('is_presentation', false)
            ->whereNull('is_final_exam')
            ->count();

        $section->delete();

        return response()->json(['message' => 'Sección eliminada.']);
    }

    private function authorize(Request $request, Course $course): void
    {
        if ($course->instructor_id !== $request->user()->id) {
            abort(403);
        }
    }
}