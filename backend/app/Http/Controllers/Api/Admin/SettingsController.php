<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseCategory;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SettingsController extends Controller
{
    // ===== CATEGORÍAS =====
    public function getCategories(): JsonResponse
    {
        return response()->json([
            'categories' => CourseCategory::orderBy('name')->get()
        ]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:course_categories,name',
            'icon' => 'required|string|max:50',
        ]);

        $category = CourseCategory::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'icon' => $request->icon,
        ]);

        return response()->json(['category' => $category], 201);
    }

    public function updateCategory(Request $request, CourseCategory $category): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:course_categories,name,' . $category->id,
            'icon' => 'required|string|max:50',
        ]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'icon' => $request->icon,
        ]);

        return response()->json(['category' => $category]);
    }

    public function destroyCategory(CourseCategory $category): JsonResponse
    {
        // Verificar que no tenga cursos asociados
        if ($category->courses()->count() > 0) {
            return response()->json([
                'message' => 'No podés eliminar una categoría que tiene cursos asociados.'
            ], 422);
        }

        $category->delete();
        return response()->json(['message' => 'Categoría eliminada.']);
    }

    // ===== PLANES =====
    public function getPlans(): JsonResponse
    {
        return response()->json(['plans' => Plan::orderBy('price')->get()]);
    }

    public function updatePlan(Request $request, Plan $plan): JsonResponse
    {
        $request->validate([
            'price'               => 'required|numeric|min:0',
            'monthly_tokens'      => 'required|integer|min:0',
            'quiz_attempts'       => 'required|integer|min:1',
            'exam_attempts'       => 'required|integer|min:1',
            'unlimited_attempts'  => 'required|boolean',
            'unlimited_tokens'    => 'required|boolean',
        ]);

        $plan->update($request->only([
            'price', 'monthly_tokens', 'quiz_attempts',
            'exam_attempts', 'unlimited_attempts', 'unlimited_tokens',
        ]));

        return response()->json(['plan' => $plan]);
    }
}