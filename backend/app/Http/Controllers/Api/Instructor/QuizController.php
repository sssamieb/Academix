<?php

namespace App\Http\Controllers\Api\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    // Actualizar quiz completo (preguntas y opciones)
    public function update(Request $request, Course $course, Quiz $quiz): JsonResponse
    {
        $this->authorize($request, $course);

        $request->validate([
    'title'              => 'sometimes|string|max:255',
    'passing_score'      => 'sometimes|integer|min:1|max:100',
    'is_active'          => 'sometimes|boolean',
    'time_limit_minutes' => 'sometimes|integer|min:1|max:180',
    'questions'          => 'sometimes|array',
    'questions.*.question'              => 'required_with:questions|string',
    'questions.*.options'               => 'required_with:questions|array|min:2',
    'questions.*.options.*.option_text' => 'required|string',
    'questions.*.options.*.is_correct'  => 'required|boolean',
]);

        $quiz->update($request->only(['title', 'passing_score', 'is_active', 'time_limit_minutes']));

        // El quiz no tiene acceso directo al course status, así que lo obtenemos a través de la lección y sección (si existen)
        $course = $quiz->lesson?->section?->course ?? $quiz->course;
        if ($course && !in_array($course->status, ['draft', 'rejected'])) {
            return response()->json(['message' => 'Solo podés editar cursos en borrador o rechazados.'], 403);
        }

        if ($request->has('questions')) {
            // Borrar preguntas existentes y recrear
            $quiz->questions()->delete();

            foreach ($request->questions as $qOrder => $qData) {
                $question = $quiz->questions()->create([
                    'question' => $qData['question'],
                    'order'    => $qOrder,
                ]);

                foreach ($qData['options'] as $option) {
                    $question->options()->create([
                        'option_text' => $option['option_text'],
                        'is_correct'  => $option['is_correct'],
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Quiz actualizado.',
            'quiz'    => $quiz->load('questions.options'),
        ]);
    }

    private function authorize(Request $request, Course $course): void
    {
        if ($course->instructor_id !== $request->user()->id) abort(403);
    }
}