<?php

namespace App\Http\Controllers\Api\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $courses = Course::where('instructor_id', $user->id)
            ->where('status', 'published')
            ->withCount(['enrollments' => fn($q) => $q->whereIn('status', ['active', 'completed', 'trial'])])
            ->with(['enrollments' => function($q) {
                $q->whereIn('status', ['active', 'completed', 'trial'])
                  ->with('user:id,name,email,avatar_color,created_at');
            }])
            ->get();

        return response()->json(['courses' => $courses]);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $courses = Course::where('instructor_id', $user->id)->get();

        // Inscripciones por curso
        $enrollmentsByCourse = Course::where('instructor_id', $user->id)
            ->where('status', 'published')
            ->withCount('enrollments')
            ->with('category')
            ->get()
            ->map(fn($c) => [
                'title'       => $c->title,
                'enrollments' => $c->enrollments_count,
                'category'    => $c->category?->name,
            ]);

        // Completados vs en progreso vs trial
        $allEnrollments = Enrollment::whereHas('course', fn($q) => $q->where('instructor_id', $user->id))
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Inscripciones por mes (últimos 6 meses)
        $monthlyEnrollments = Enrollment::whereHas('course', fn($q) => $q->where('instructor_id', $user->id))
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count')
            ->groupBy('year', 'month')
            ->orderBy('year')->orderBy('month')
            ->get()
            ->map(fn($e) => [
                'label' => \Carbon\Carbon::create($e->year, $e->month)->translatedFormat('M Y'),
                'count' => $e->count,
            ]);

        // Cursos por estado
        $coursesByStatus = $courses->groupBy('status')
            ->map(fn($g, $status) => ['status' => $status, 'count' => $g->count()])
            ->values();

        return response()->json([
            'totals' => [
                'courses'     => $courses->count(),
                'published'   => $courses->where('status', 'published')->count(),
                'students'    => Enrollment::whereHas('course', fn($q) => $q->where('instructor_id', $user->id))
                                    ->whereIn('status', ['active', 'completed'])
                                    ->count(),
                'completed'   => $allEnrollments['completed'] ?? 0,
            ],
            'enrollments_by_course' => $enrollmentsByCourse,
            'monthly_enrollments'   => $monthlyEnrollments,
            'enrollments_by_status' => $allEnrollments,
            'courses_by_status'     => $coursesByStatus,
        ]);
    }
}