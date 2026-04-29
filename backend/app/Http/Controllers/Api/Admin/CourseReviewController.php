<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseReviewController extends Controller
{
    // Listar cursos en revisión
    public function index(): JsonResponse
    {
        $courses = Course::whereIn('status', ['in_review', 'published', 'rejected'])
            ->with(['instructor', 'category'])
            ->withCount('enrollments')
            ->orderByRaw("FIELD(status, 'in_review', 'rejected', 'published')")
            ->orderBy('submitted_at', 'asc')
            ->get();

        return response()->json(['courses' => $courses]);
    }

    // Ver detalle de un curso para revisión
    public function show(Course $course): JsonResponse
    {
        return response()->json([
            'course' => $course->load([
                'instructor',
                'category',
                'sections' => fn($q) => $q->orderBy('order'),
                'sections.lessons' => fn($q) => $q->orderBy('order'),
                'sections.lessons.quiz.questions.options',
            ]),
        ]);
    }

    // Aprobar curso
    public function approve(Request $request, Course $course): JsonResponse
    {
        if ($course->status !== 'in_review') {
            return response()->json(['message' => 'El curso no está en revisión.'], 422);
        }

        $request->validate([
            'token_price'    => 'required|integer|min:1',
            'launch_date'    => 'nullable|date|after:today',
        ]);

        // Generar examen final con preguntas aleatorias de los quizzes
        $this->generateFinalExam($course, $request->input('exam_questions', 10));

        $course->update([
            'status'      => 'published',
            'token_price' => $request->token_price,
            'approved_at' => now(),
            'launch_date' => $request->launch_date,
        ]);

        return response()->json(['message' => 'Curso aprobado y publicado exitosamente.']);
    }

    // Rechazar curso
    public function reject(Request $request, Course $course): JsonResponse
    {
        if ($course->status !== 'in_review') {
            return response()->json(['message' => 'El curso no está en revisión.'], 422);
        }

        $request->validate([
            'rejection_reason' => 'required|string|min:10',
        ]);

        $course->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        return response()->json(['message' => 'Curso rechazado. Se notificó al instructor.']);
    }

    // Despublicar curso
    public function unpublish(Course $course): JsonResponse
    {
        if ($course->status !== 'published') {
            return response()->json(['message' => 'El curso no está publicado.'], 422);
        }

        $course->update(['status' => 'unpublished']);

        return response()->json(['message' => 'Curso despublicado.']);
    }

    private function generateFinalExam(Course $course, int $questionCount = 10): void
    {
        $exam = $course->finalExam;
        if (!$exam) return;

        // Borrar preguntas anteriores si las hay
        $exam->questions()->delete();

        // Obtener todas las preguntas de los quizzes de práctica activos
        $allQuestions = QuizQuestion::whereHas('quiz', function ($q) use ($course) {
            $q->where('course_id', $course->id)
              ->where('type', 'practice')
              ->where('is_active', true);
        })->with('options')->get();

        if ($allQuestions->isEmpty()) return;

        // Seleccionar aleatoriamente
        $selected = $allQuestions->shuffle()->take($questionCount);

        foreach ($selected as $order => $original) {
            $newQuestion = $exam->questions()->create([
                'question' => $original->question,
                'order'    => $order,
            ]);

            foreach ($original->options as $option) {
                $newQuestion->options()->create([
                    'option_text' => $option->option_text,
                    'is_correct'  => $option->is_correct,
                ]);
            }
        }
    }

    public function preview(Course $course): JsonResponse
    {
        return response()->json([
            'course' => $course->load([
                'category',
                'instructor',
                'sections'                         => fn($q) => $q->orderBy('order'),
                'sections.lessons'                 => fn($q) => $q->orderBy('order'),
                'sections.lessons.quiz.questions.options',
            ]),
        ]);
    }
    public function lessonPreview(Course $course, Lesson $lesson): JsonResponse
    {
        return response()->json([
            'lesson' => $lesson->load('quiz.questions.options'),
        ]);
    }
}