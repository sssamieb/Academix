<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InstructorController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\Instructor\CourseController;
use App\Http\Controllers\Api\Instructor\SectionController;
use App\Http\Controllers\Api\Instructor\LessonController;
use App\Http\Controllers\Api\Instructor\QuizController;
use App\Http\Controllers\Api\Admin\CourseReviewController;
use Illuminate\Support\Facades\Route;

// Chatbot público
Route::post('/chatbot', [ChatbotController::class, 'chat']);

// Rutas públicas de auth
Route::prefix('auth')->group(function () {
    Route::post('/register',            [AuthController::class, 'register']);
    Route::post('/login',               [AuthController::class, 'login']);
    Route::post('/forgot-password',     [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password',      [AuthController::class, 'resetPassword']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification']);

    Route::get('/verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->name('verification.verify');

    Route::get('/google/redirect', [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback',  [SocialAuthController::class, 'handleGoogleCallback']);
});

// Rutas protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout',           [AuthController::class, 'logout']);
    Route::get('/auth/me',                [AuthController::class, 'me']);
    Route::post('/auth/change-password',  [AuthController::class, 'changePassword']);
    Route::post('/chatbot/authenticated', [ChatbotController::class, 'chat']);

    // Admin
    Route::middleware('role:admin')->group(function () {
        Route::post('/instructors', [InstructorController::class, 'store']);
        Route::get('/instructors',  [InstructorController::class, 'index']);

        // Revisión de cursos
        Route::get('/admin/courses',                        [CourseReviewController::class, 'index']);
        Route::get('/admin/courses/{course}',               [CourseReviewController::class, 'show']);
        Route::post('/admin/courses/{course}/approve',      [CourseReviewController::class, 'approve']);
        Route::post('/admin/courses/{course}/reject',       [CourseReviewController::class, 'reject']);
        Route::post('/admin/courses/{course}/unpublish',    [CourseReviewController::class, 'unpublish']);
        Route::get('/admin/courses/{course}/preview', [CourseReviewController::class, 'preview']);
        Route::get('/admin/courses/{course}/lessons/{lesson}/preview', [CourseReviewController::class, 'lessonPreview']);
    });

    // Instructor
    Route::middleware('role:instructor')->prefix('instructor')->group(function () {
        // Cursos
        Route::get('/courses',                  [CourseController::class, 'index']);
        Route::post('/courses',                 [CourseController::class, 'store']);
        Route::get('/courses/{course}',         [CourseController::class, 'show']);
        Route::put('/courses/{course}',         [CourseController::class, 'update']);
        Route::post('/courses/{course}/submit', [CourseController::class, 'submitForReview']);
        Route::get('/categories',               [CourseController::class, 'categories']);
        Route::get('/courses/{course}/preview', [CourseController::class, 'preview']);
        Route::delete('/courses/{course}', [CourseController::class, 'destroy']);

        // Secciones
        Route::post('/courses/{course}/sections',              [SectionController::class, 'store']);
        Route::put('/courses/{course}/sections/{section}',     [SectionController::class, 'update']);
        Route::delete('/courses/{course}/sections/{section}',  [SectionController::class, 'destroy']);

        // Lecciones
        Route::post('/courses/{course}/sections/{section}/lessons',              [LessonController::class, 'store']);
        Route::put('/courses/{course}/sections/{section}/lessons/{lesson}',      [LessonController::class, 'update']);
        Route::delete('/courses/{course}/sections/{section}/lessons/{lesson}',   [LessonController::class, 'destroy']);

        // Quiz
        Route::put('/courses/{course}/quizzes/{quiz}', [QuizController::class, 'update']);
    });
});