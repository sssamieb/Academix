<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportsController extends Controller
{
    public function index(): JsonResponse
    {
        // Top cursos por inscripciones
        $topCourses = Course::where('status', 'published')
            ->withCount('enrollments')
            ->with(['category', 'instructor'])
            ->orderBy('enrollments_count', 'desc')
            ->take(10)
            ->get()
            ->map(fn($c) => [
                'title'       => $c->title,
                'instructor'  => $c->instructor?->name,
                'category'    => $c->category?->name,
                'enrollments' => $c->enrollments_count,
                'token_price' => $c->token_price,
            ]);

        // Ingresos por mes (últimos 6 meses)
        $monthlyRevenue = Payment::where('status', 'succeeded')
            ->where('paid_at', '>=', now()->subMonths(6))
            ->selectRaw('YEAR(paid_at) as year, MONTH(paid_at) as month, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('year', 'month')
            ->orderBy('year')->orderBy('month')
            ->get()
            ->map(fn($p) => [
                'label'  => \Carbon\Carbon::create($p->year, $p->month)->translatedFormat('M Y'),
                'total'  => round($p->total, 2),
                'count'  => $p->count,
            ]);

        // Ingresos por plan
        $revenueByPlan = Payment::where('status', 'succeeded')
            ->selectRaw('plan_type, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('plan_type')
            ->get()
            ->map(fn($p) => [
                'plan'  => ucfirst($p->plan_type),
                'total' => round($p->total, 2),
                'count' => $p->count,
            ]);

        // Estudiantes activos vs inactivos
        $activeStudents   = User::where('role', 'student')->where('is_active', true)->count();
        $inactiveStudents = User::where('role', 'student')->where('is_active', false)->count();

        // Estudiantes por mes (últimos 6 meses)
        $monthlyStudents = User::where('role', 'student')
            ->where('created_at', '>=', now()->subMonths(6))
            ->selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, COUNT(*) as count')
            ->groupBy('year', 'month')
            ->orderBy('year')->orderBy('month')
            ->get()
            ->map(fn($u) => [
                'label' => \Carbon\Carbon::create($u->year, $u->month)->translatedFormat('M Y'),
                'count' => $u->count,
            ]);

        // Cursos por categoría
        $coursesByCategory = Course::where('status', 'published')
            ->with('category')
            ->get()
            ->groupBy('category.name')
            ->map(fn($courses, $name) => [
                'category' => $name ?? 'Sin categoría',
                'count'    => $courses->count(),
            ])
            ->values();
        // Listado completo de estudiantes
$studentsList = User::where('role', 'student')
    ->with('plan')
    ->orderBy('created_at', 'desc')
    ->get()
    ->map(fn($u) => [
        'name'       => $u->name,
        'email'      => $u->email,
        'is_active'  => $u->is_active,
        'plan'       => $u->plan?->name,
        'tokens'     => $u->tokens,
        'created_at' => $u->created_at->format('d/m/Y H:i'),
    ]);

// Listado completo de instructores
$instructorsList = User::where('role', 'instructor')
    ->withCount(['courses' => fn($q) => $q->where('status', 'published')])
    ->orderBy('created_at', 'desc')
    ->get()
    ->map(fn($u) => [
        'name'          => $u->name,
        'email'         => $u->email,
        'is_active'     => $u->is_active,
        'courses_count' => $u->courses_count,
        'created_at'    => $u->created_at->format('d/m/Y H:i'),
    ]);


        return response()->json([
            'top_courses'        => $topCourses,
            'monthly_revenue'    => $monthlyRevenue,
            'revenue_by_plan'    => $revenueByPlan,
            'active_students'    => $activeStudents,
            'inactive_students'  => $inactiveStudents,
            'monthly_students'   => $monthlyStudents,
            'courses_by_category'=> $coursesByCategory,
            'students_list'    => $studentsList,
            'instructors_list' => $instructorsList,
            'totals' => [
                'revenue'     => round(Payment::where('status', 'succeeded')->sum('amount'), 2),
                'students'    => User::where('role', 'student')->count(),
                'enrollments' => Enrollment::whereIn('status', ['active', 'completed'])->count(),
            ],
        ]);
    }
}