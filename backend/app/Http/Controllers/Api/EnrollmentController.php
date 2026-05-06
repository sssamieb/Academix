<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\LessonProgress;

class EnrollmentController extends Controller
{
    public function enroll(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        if ($course->status !== 'published') {
            return response()->json(['message' => 'Este curso no está disponible.'], 422);
        }

        if (Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            return response()->json(['message' => 'Ya estás inscrito en este curso.'], 422);
        }

        if (!$user->plan_id || $user->subscription_status !== 'active') {
            return response()->json(['message' => 'Necesitás un plan activo para inscribirte.'], 403);
        }

        if (!$user->plan->unlimited_tokens) {
            if ($user->tokens < $course->token_price) {
                return response()->json([
                    'message'           => 'No tenés suficientes tokens.',
                    'tokens_needed'     => $course->token_price,
                    'tokens_available'  => $user->tokens,
                ], 422);
            }
            $user->decrement('tokens', $course->token_price);
        }

        Enrollment::create([
            'user_id'      => $user->id,
            'course_id'    => $course->id,
            'tokens_spent' => $course->token_price,
            'status'       => 'trial',
        ]);

        return response()->json([
            'message'          => 'Inscripción exitosa.',
            'tokens_remaining' => $user->fresh()->tokens,
        ]);
    }

    public function refund(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No estás inscrito en este curso.'], 404);
        }

        if ($enrollment->status !== 'trial') {
            return response()->json(['message' => 'Ya no podés solicitar reembolso para este curso.'], 422);
        }

        if (!$user->plan?->unlimited_tokens) {
            $user->increment('tokens', $enrollment->tokens_spent);
        }

        $enrollment->update(['status' => 'refunded']);

        return response()->json([
            'message'          => 'Reembolso exitoso. Los tokens fueron devueltos.',
            'tokens_remaining' => $user->fresh()->tokens,
        ]);
    }

    public function confirmEnrollment(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No estás inscrito.'], 404);
        }

        $enrollment->update([
            'status'            => 'active',
            'trial_decision_at' => now(),
        ]);

        return response()->json(['message' => 'Confirmado. Disfrutá el curso.']);
    }

public function myCourses(Request $request): JsonResponse
{
    $user        = $request->user();
    $enrollments = Enrollment::where('user_id', $user->id)
        ->whereIn('status', ['trial', 'active', 'completed'])
        ->with(['course.category', 'course.instructor'])
        ->orderBy('created_at', 'desc')
        ->get();

    // Agregar progreso a cada enrollment
    $enrollments->each(function ($enrollment) use ($user) {
        $course = $enrollment->course;

        $totalLessons = $course->sections()
            ->where('is_presentation', false)
            ->where('is_final_exam', false)
            ->withCount('lessons')
            ->get()
            ->sum('lessons_count');

        $completedLessons = LessonProgress::where('user_id', $user->id)
            ->where('enrollment_id', $enrollment->id)
            ->where('is_completed', true)
            ->count();

        $enrollment->total_lessons     = $totalLessons;
        $enrollment->completed_lessons = $completedLessons;
        $enrollment->progress_percent  = $totalLessons > 0
            ? round(($completedLessons / $totalLessons) * 100)
            : 0;
    });

    return response()->json(['enrollments' => $enrollments]);
}
    public function checkEnrollment(Request $request, Course $course): JsonResponse
    {
        $enrollment = Enrollment::where('user_id', $request->user()->id)
            ->where('course_id', $course->id)
            ->first();

        return response()->json([
            'enrolled'        => !!$enrollment && $enrollment->status !== 'refunded',
            'refund_eligible' => $enrollment?->status === 'trial',
            'status'          => $enrollment?->status,
        ]);
    }
}