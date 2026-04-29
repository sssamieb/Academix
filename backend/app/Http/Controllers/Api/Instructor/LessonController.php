<?php

namespace App\Http\Controllers\Api\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    // Actualizar lección
    public function update(Request $request, Course $course, CourseSection $section, Lesson $lesson): JsonResponse
    {
        $this->authorize($request, $course);

        if (!in_array($course->status, ['draft', 'rejected'])) {
            return response()->json(['message' => 'Solo podés editar cursos en borrador o rechazados.'], 403);
        }

        $request->validate([
            'title'           => 'sometimes|string|max:255',
            'video_url'       => 'sometimes|nullable|string',
            'article_content' => 'sometimes|nullable|string',
            'notes'           => 'sometimes|nullable|string',
            'type'            => 'sometimes|nullable|in:video,article',
            'duration'        => 'sometimes|nullable|integer|min:1',
        ]);

        $lesson->update($request->only([
            'title', 'video_url', 'article_content', 'notes', 'type', 'duration'
        ]));

        return response()->json([
            'message' => 'Lección actualizada.',
            'lesson'  => $lesson->load('quiz.questions.options'),
        ]);
    }

    // Agregar lección
    public function store(Request $request, Course $course, CourseSection $section): JsonResponse
    {
        $this->authorize($request, $course);

        if (!in_array($course->status, ['draft', 'rejected'])) {
            return response()->json(['message' => 'Solo podés editar cursos en borrador o rechazados.'], 403);
        }

        $request->validate(['title' => 'required|string|max:255']);

        $order  = $section->lessons()->max('order') + 1;
        $lesson = $section->lessons()->create([
            'title'           => $request->title,
            'type'            => 'both',
            'video_url'       => null,
            'article_content' => null,
            'order'           => $order,
            'is_preview'      => false,
        ]);

        Quiz::create([
            'lesson_id'     => $lesson->id,
            'course_id'     => $course->id,
            'type'          => 'practice',
            'title'         => 'Quiz - ' . $request->title,
            'passing_score' => 70,
        ]);

        return response()->json([
            'message' => 'Lección agregada.',
            'lesson'  => $lesson->load('quiz.questions.options'),
        ], 201);
    }

    // Eliminar lección
    public function destroy(Request $request, Course $course, CourseSection $section, Lesson $lesson): JsonResponse
    {
        $this->authorize($request, $course);

        if (!in_array($course->status, ['draft', 'rejected'])) {
            return response()->json(['message' => 'Solo podés editar cursos en borrador o rechazados.'], 403);
        }

        if ($section->lessons()->count() <= 1) {
            return response()->json(['message' => 'La sección debe tener al menos una lección.'], 422);
        }

        $lesson->delete();

        return response()->json(['message' => 'Lección eliminada.']);
    }

    private function authorize(Request $request, Course $course): void
    {
        if ($course->instructor_id !== $request->user()->id) abort(403);
    }
}