<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $students    = User::where('role', 'student')->count();
        $instructors = User::where('role', 'instructor')->count();
        $courses     = Course::where('status', 'published')->count();
        $revenue     = Payment::where('status', 'succeeded')->sum('amount');

        $recentUsers = User::orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($u) => [
                'name'      => $u->name,
                'email'     => $u->email,
                'role'      => $u->role,
                'roleLabel' => match($u->role) {
                    'student'    => 'Estudiante',
                    'instructor' => 'Instructor',
                    'admin'      => 'Admin',
                    default      => $u->role,
                },
                'active'   => $u->is_active,
                'date'     => $u->created_at->diffForHumans(),
                'initials' => collect(explode(' ', $u->name))
                                ->map(fn($w) => strtoupper($w[0]))
                                ->take(2)->implode(''),
                'color'    => $u->avatar_color ?? '#4F46E5',
            ]);

        $recentPayments = Payment::where('status', 'succeeded')
            ->with('user')
            ->orderBy('paid_at', 'desc')
            ->take(3)
            ->get()
            ->map(fn($p) => [
                'type' => 'payment',
                'text' => "Pago recibido: Plan {$p->plan_name} - \${$p->amount}",
                'time' => $p->paid_at->diffForHumans(),
            ]);

        $recentStudents = User::where('role', 'student')
            ->orderBy('created_at', 'desc')
            ->take(2)
            ->get()
            ->map(fn($u) => [
                'type' => 'student',
                'text' => "Nuevo estudiante registrado: {$u->name}",
                'time' => $u->created_at->diffForHumans(),
            ]);

        $recentCourses = Course::where('status', 'published')
            ->orderBy('approved_at', 'desc')
            ->take(2)
            ->get()
            ->map(fn($c) => [
                'type' => 'course',
                'text' => "Curso \"{$c->title}\" publicado",
                'time' => $c->approved_at?->diffForHumans() ?? 'Recientemente',
            ]);

        $activity = collect()
            ->merge($recentPayments)
            ->merge($recentStudents)
            ->merge($recentCourses)
            ->sortByDesc('time')
            ->take(5)
            ->values();

        return response()->json([
            'stats' => [
                'students'    => $students,
                'instructors' => $instructors,
                'courses'     => $courses,
                'revenue'     => number_format($revenue, 2),
            ],
            'recent_users'    => $recentUsers,
            'recent_activity' => $activity,
        ]);
    }
}