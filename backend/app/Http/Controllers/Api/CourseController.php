<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Course::where('status', 'published')
            ->with(['category', 'instructor'])
            ->withCount('enrollments');

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->level) {
            $query->where('level', $request->level);
        }

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $courses = $query->orderBy('approved_at', 'desc')->get();

        return response()->json(['courses' => $courses]);
    }

    public function show(Course $course): JsonResponse
    {
        if ($course->status !== 'published') {
            return response()->json(['message' => 'Curso no encontrado.'], 404);
        }

        return response()->json([
            'course' => $course->load([
                'category',
                'instructor',
                'sections'         => fn($q) => $q->orderBy('order'),
                'sections.lessons' => fn($q) => $q->orderBy('order'),
            ]),
        ]);
    }

    public function categories(): JsonResponse
    {
        return response()->json([
            'categories' => CourseCategory::all(),
        ]);
    }
}