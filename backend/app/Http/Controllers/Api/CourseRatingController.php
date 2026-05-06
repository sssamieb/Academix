<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseReview;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseRatingController extends Controller

{
    // Ver reseñas de un curso (público)
    public function index(Course $course): JsonResponse
    {
        $reviews = CourseReview::where('course_id', $course->id)
            ->with('user:id,name,avatar_color')
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = $reviews->avg('rating');

        return response()->json([
            'reviews'    => $reviews,
            'avg_rating' => $avgRating ? round($avgRating, 1) : null,
            'total'      => $reviews->count(),
        ]);
    }

    // Crear reseña (estudiante que completó)
    public function store(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        // Verificar que completó el curso
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->where('status', 'completed')
            ->first();

        if (!$enrollment) {
            return response()->json([
                'message' => 'Necesitás completar el curso para dejar una reseña.'
            ], 403);
        }

        // Verificar que no haya dejado reseña antes
        $existing = CourseReview::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Ya dejaste una reseña para este curso.'
            ], 422);
        }

        $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review = CourseReview::create([
            'user_id'       => $user->id,
            'course_id'     => $course->id,
            'enrollment_id' => $enrollment->id,
            'rating'        => $request->rating,
            'comment'       => $request->comment,
        ]);

        $review->load('user:id,name,avatar_color');

        return response()->json(['review' => $review], 201);
    }

    // Ver reseñas del instructor (sus cursos)
    public function instructorReviews(Request $request): JsonResponse
    {
        $user = $request->user();

        $reviews = CourseReview::whereHas('course', fn($q) => $q->where('instructor_id', $user->id))
            ->with(['user:id,name,avatar_color', 'course:id,title'])
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = $reviews->avg('rating');

        return response()->json([
            'reviews'    => $reviews,
            'avg_rating' => $avgRating ? round($avgRating, 1) : null,
            'total'      => $reviews->count(),
        ]);
    }

    // Ver todas las reseñas (admin)
    public function adminIndex(Request $request): JsonResponse
    {
        $reviews = CourseReview::with([
            'user:id,name,avatar_color',
            'course:id,title'
        ])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json(['reviews' => $reviews]);
    }

    // Eliminar reseña (admin)
    public function destroy(Request $request, CourseReview $review): JsonResponse
    {
        $review->delete();
        return response()->json(['message' => 'Reseña eliminada.']);
    }
}