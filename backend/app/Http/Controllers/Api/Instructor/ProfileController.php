<?php

namespace App\Http\Controllers\Api\Instructor;

use App\Http\Controllers\Controller;
use App\Models\InstructorProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = InstructorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['avatar_color' => '#4F46E5']
        );

        $stats = [
            'courses'  => $user->courses()->where('status', 'published')->count(),
            'students' => $user->courses()
                ->withCount('enrollments')
                ->get()
                ->sum('enrollments_count'),
        ];

        return response()->json([
            'user'    => $user,
            'profile' => $profile,
            'stats'   => $stats,
            'courses' => $user->courses()
                ->where('status', 'published')
                ->with('category')
                ->withCount('enrollments')
                ->get(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'title'        => 'nullable|string|max:120',
            'bio'          => 'nullable|string|max:1000',
            'linkedin'     => 'nullable|url|max:255',
            'github'       => 'nullable|url|max:255',
            'twitter'      => 'nullable|url|max:255',
            'website'      => 'nullable|url|max:255',
            'avatar_color' => 'nullable|string|max:7',
        ]);

        $user    = $request->user();
        $profile = InstructorProfile::updateOrCreate(
            ['user_id' => $user->id],
            $request->only(['title', 'bio', 'linkedin', 'github', 'twitter', 'website', 'avatar_color'])
        );

        return response()->json([
            'message' => 'Perfil actualizado.',
            'profile' => $profile,
        ]);
    }

    public function publicShow(User $user): JsonResponse
    {
        if ($user->role !== 'instructor') {
            return response()->json(['message' => 'Perfil no encontrado.'], 404);
        }

        $profile = InstructorProfile::firstOrCreate(
            ['user_id' => $user->id],
            ['avatar_color' => '#4F46E5']
        );

        return response()->json([
            'user'    => $user->only(['id', 'name', 'email']),
            'profile' => $profile,
            'stats'   => [
                'courses'  => $user->courses()->where('status', 'published')->count(),
                'students' => $user->courses()
                    ->withCount('enrollments')
                    ->get()
                    ->sum('enrollments_count'),
            ],
            'courses' => $user->courses()
                ->where('status', 'published')
                ->with('category')
                ->withCount('enrollments')
                ->get(),
        ]);
    }
}