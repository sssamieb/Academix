<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserManagementController extends Controller
{
    // Listar instructores
    public function instructors(Request $request): JsonResponse
    {
        $query = User::where('role', 'instructor')
            ->with('plan')
            ->withCount('courses');

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name',  'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $instructors = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['instructors' => $instructors]);
    }

    // Listar estudiantes
    public function students(Request $request): JsonResponse
    {
        $query = User::where('role', 'student')
            ->with('plan')
            ->withCount('enrollments');

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name',  'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $students = $query->orderBy('created_at', 'desc')->get();

        return response()->json(['students' => $students]);
    }

    // Habilitar/deshabilitar usuario
    public function toggleActive(User $user): JsonResponse
{
    $user->update(['is_active' => !$user->is_active]);

    // Si se deshabilita, revocar todos los tokens activos
    if (!$user->is_active) {
        $user->tokens()->delete();
    }

    return response()->json([
        'message'   => $user->is_active ? 'Usuario habilitado.' : 'Usuario deshabilitado.',
        'is_active' => $user->is_active,
    ]);
}

    // Promover estudiante a instructor
    public function promoteToInstructor(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user->role === 'instructor') {
            return response()->json(['message' => 'Este usuario ya es instructor.'], 422);
        }

        if ($user->role === 'admin') {
            return response()->json(['message' => 'No podés cambiar el rol de un administrador.'], 422);
        }

        $user->update(['role' => 'instructor']);

        // Notificar por email
        $user->notify(new \App\Notifications\PromotedToInstructorNotification());

        return response()->json([
            'message' => 'Usuario promovido a instructor exitosamente.',
            'user'    => $user,
        ]);
    }

    // Buscar usuario por email para promover
    public function findByEmail(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)
            ->where('role', 'student')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'No se encontró un estudiante con ese email.'], 404);
        }

        return response()->json(['user' => $user->only(['id', 'name', 'email', 'role', 'is_active'])]);
    }
}