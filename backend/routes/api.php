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
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\Student\StudentCourseController;
use App\Http\Controllers\Api\Instructor\ProfileController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\ForumController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\CourseRatingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ReportsController;
use App\Http\Controllers\Api\Instructor\StudentController as InstructorStudentController;
use App\Http\Controllers\Api\Admin\SettingsController;

// Chatbot público
Route::post('/chatbot', [ChatbotController::class, 'chat']);

// Rutas públicas de cursos
Route::get('/courses',            [App\Http\Controllers\Api\CourseController::class, 'index']);
Route::get('/courses/{course}',   [App\Http\Controllers\Api\CourseController::class, 'show']);
Route::get('/course-categories',  [App\Http\Controllers\Api\CourseController::class, 'categories']);

// Planes públicos
Route::get('/plans', [SubscriptionController::class, 'plans']);

// Webhook de Stripe — sin auth
Route::post('/stripe/webhook', [SubscriptionController::class, 'webhook']);

// Público — cualquiera puede ver el perfil de un instructor
Route::get('/instructors/{user}/profile', [ProfileController::class, 'publicShow']);
//publico - descarga de certificado
Route::get('/certificates/{certificate}/download', [CertificateController::class, 'download']);
//publico - reseñas de cursos
Route::get('/courses/{course}/reviews',   [CourseRatingController::class, 'index']);
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
    Route::get('/certificates',                        [CertificateController::class, 'index']);
    Route::post('/auth/update-name', [AuthController::class, 'updateName']);
    //reseñas
    Route::post('/courses/{course}/reviews',      [CourseRatingController::class, 'store']);
    Route::get('/instructor/reviews',             [CourseRatingController::class, 'instructorReviews']);
    Route::get('/admin/reviews',                  [CourseRatingController::class, 'adminIndex']);
    Route::delete('/admin/reviews/{review}',      [CourseRatingController::class, 'destroy']);


    // Suscripciones
    Route::get('/subscription/status',    [SubscriptionController::class, 'status']);
    Route::post('/subscription/checkout', [SubscriptionController::class, 'checkout']);
    Route::post('/subscription/cancel',   [SubscriptionController::class, 'cancel']);

    // Inscripciones
    Route::get('/my-courses',                           [EnrollmentController::class, 'myCourses']);
    Route::get('/courses/{course}/enrollment-status',   [EnrollmentController::class, 'checkEnrollment']);
    Route::post('/courses/{course}/enroll',             [EnrollmentController::class, 'enroll']);
    Route::post('/courses/{course}/refund',             [EnrollmentController::class, 'refund']);
    Route::post('/courses/{course}/confirm-enrollment', [EnrollmentController::class, 'confirmEnrollment']);
    // Estudiante — acceso a cursos
    Route::get('/student/courses/{course}',                    [StudentCourseController::class, 'show']);
    Route::get('/student/courses/{course}/lessons/{lesson}',   [StudentCourseController::class, 'lesson']);
    Route::post('/student/courses/{course}/lessons/{lesson}/mark', [StudentCourseController::class, 'markLesson']);
    Route::post('/student/courses/{course}/quizzes/{quiz}/submit', [StudentCourseController::class, 'submitQuiz']);
    Route::get('/student/courses/{course}/exam', [StudentCourseController::class, 'exam']);
    // Pagos
    Route::get('/payments/history', [PaymentController::class, 'history']);
    //forum
    Route::get('/courses/{course}/forum',                      [ForumController::class, 'index']);
    Route::post('/courses/{course}/forum',                     [ForumController::class, 'store']);
    Route::post('/courses/{course}/forum/{post}/reply',        [ForumController::class, 'reply']);
    Route::delete('/courses/{course}/forum/{post}',            [ForumController::class, 'destroyPost']);
    Route::delete('/courses/{course}/forum/{post}/reply/{reply}', [ForumController::class, 'destroyReply']);
    
    Route::post('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/admin/settings/categories',              [SettingsController::class, 'getCategories']);
    Route::post('/admin/settings/categories',             [SettingsController::class, 'storeCategory']);
    Route::put('/admin/settings/categories/{category}',  [SettingsController::class, 'updateCategory']);
    Route::delete('/admin/settings/categories/{category}', [SettingsController::class, 'destroyCategory']);

    // Planes
    Route::get('/admin/settings/plans',           [SettingsController::class, 'getPlans']);
    Route::put('/admin/settings/plans/{plan}',    [SettingsController::class, 'updatePlan']);

    // Estadísticas de instructor
    Route::get('/instructor/students', [InstructorStudentController::class, 'index']);
    Route::get('/instructor/stats',    [InstructorStudentController::class, 'stats']);
    // Admin
    Route::middleware('role:admin')->group(function () {
        Route::post('/instructors', [InstructorController::class, 'store']);
        Route::get('/instructors',  [InstructorController::class, 'index']);
        Route::get('/admin/instructors',                    [UserManagementController::class, 'instructors']);
        Route::get('/admin/students',                       [UserManagementController::class, 'students']);
        Route::post('/admin/users/{user}/toggle-active',    [UserManagementController::class, 'toggleActive']);
        Route::post('/admin/users/promote-instructor',      [UserManagementController::class, 'promoteToInstructor']);
        Route::get('/admin/users/find-by-email',            [UserManagementController::class, 'findByEmail']);
        Route::get('/admin/dashboard/stats', [App\Http\Controllers\Api\Admin\DashboardController::class, 'stats']);
        Route::get('/admin/reports', [App\Http\Controllers\Api\Admin\ReportsController::class, 'index']);
        Route::get('/admin/courses',                                            [CourseReviewController::class, 'index']);
        Route::get('/admin/courses/{course}',                                   [CourseReviewController::class, 'show']);
        Route::post('/admin/courses/{course}/approve',                          [CourseReviewController::class, 'approve']);
        Route::post('/admin/courses/{course}/reject',                           [CourseReviewController::class, 'reject']);
        Route::post('/admin/courses/{course}/unpublish',                        [CourseReviewController::class, 'unpublish']);
        Route::get('/admin/courses/{course}/preview',                           [CourseReviewController::class, 'preview']);
        Route::get('/admin/courses/{course}/lessons/{lesson}/preview',          [CourseReviewController::class, 'lessonPreview']);
    });

    // Instructor
    Route::middleware('role:instructor')->prefix('instructor')->group(function () {
        Route::get('/courses',                  [CourseController::class, 'index']);
        Route::post('/courses',                 [CourseController::class, 'store']);
        Route::get('/courses/{course}',         [CourseController::class, 'show']);
        Route::put('/courses/{course}',         [CourseController::class, 'update']);
        Route::post('/courses/{course}/submit', [CourseController::class, 'submitForReview']);
        Route::get('/categories',               [CourseController::class, 'categories']);
        Route::get('/courses/{course}/preview', [CourseController::class, 'preview']);
        Route::delete('/courses/{course}',      [CourseController::class, 'destroy']);

        Route::post('/courses/{course}/sections',             [SectionController::class, 'store']);
        Route::put('/courses/{course}/sections/{section}',    [SectionController::class, 'update']);
        Route::delete('/courses/{course}/sections/{section}', [SectionController::class, 'destroy']);

        Route::post('/courses/{course}/sections/{section}/lessons',            [LessonController::class, 'store']);
        Route::put('/courses/{course}/sections/{section}/lessons/{lesson}',    [LessonController::class, 'update']);
        Route::delete('/courses/{course}/sections/{section}/lessons/{lesson}', [LessonController::class, 'destroy']);

        Route::put('/courses/{course}/quizzes/{quiz}', [QuizController::class, 'update']);

        Route::get('/profile',  [ProfileController::class, 'show']);
        Route::post('/profile', [ProfileController::class, 'update']);

       
    });
});