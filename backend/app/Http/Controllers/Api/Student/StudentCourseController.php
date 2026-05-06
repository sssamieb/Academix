<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Certificate;
use Illuminate\Support\Str;

class StudentCourseController extends Controller
{
    public function show(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['trial', 'active', 'completed'])
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No estás inscrito en este curso.'], 403);
        }

        $course->load([
            'category',
            'instructor',
            'sections'         => fn($q) => $q->orderBy('order'),
            'sections.lessons' => fn($q) => $q->orderBy('order'),
            'sections.lessons.quiz',
        ]);

        $lessonProgress = LessonProgress::where('user_id', $user->id)
            ->where('enrollment_id', $enrollment->id)
            ->pluck('is_completed', 'lesson_id');

        $passedQuizzes = QuizAttempt::where('user_id', $user->id)
            ->where('enrollment_id', $enrollment->id)
            ->where('passed', true)
            ->pluck('quiz_id')
            ->unique()
            ->toArray();

        $sections = $course->sections
            ->filter(fn($s) => !$s->is_presentation && !$s->is_final_exam)
            ->values();

        $unlockedSections    = [];
        $allContentCompleted = true;

        foreach ($sections as $index => $section) {
            if ($index === 0) {
                $unlockedSections[$section->id] = true;
            } else {
                $prevSection   = $sections[$index - 1];
                $activeQuizzes = $prevSection->lessons
                    ->filter(fn($l) => $l->quiz && $l->quiz->is_active)
                    ->pluck('quiz');

                if ($activeQuizzes->isEmpty()) {
                    $allSeen = $prevSection->lessons->every(
                        fn($l) => $lessonProgress[$l->id] ?? false
                    );
                    $unlockedSections[$section->id] = $allSeen;
                } else {
                    $allPassed = $activeQuizzes->every(
                        fn($q) => in_array($q->id, $passedQuizzes)
                    );
                    $unlockedSections[$section->id] = $allPassed;
                }
            }

            $activeQuizzes = $section->lessons
                ->filter(fn($l) => $l->quiz && $l->quiz->is_active)
                ->pluck('quiz');

            if ($activeQuizzes->isEmpty()) {
                $sectionDone = $section->lessons->every(
                    fn($l) => $lessonProgress[$l->id] ?? false
                );
            } else {
                $sectionDone = $activeQuizzes->every(
                    fn($q) => in_array($q->id, $passedQuizzes)
                );
            }

            if (!$sectionDone) $allContentCompleted = false;
        }

        $finalExamSection = $course->sections->first(fn($s) => $s->is_final_exam);
        if ($finalExamSection) {
            $unlockedSections[$finalExamSection->id] = $allContentCompleted;
        }

        $totalLessons     = $sections->sum(fn($s) => $s->lessons->count());
        $completedLessons = $lessonProgress->filter(fn($v) => $v)->count();
        $trialThreshold   = max(1, min(3, (int) ceil($totalLessons * 0.1)));

        $attemptsPerQuiz = QuizAttempt::where('user_id', $user->id)
            ->where('enrollment_id', $enrollment->id)
            ->selectRaw('quiz_id, COUNT(*) as attempts_count')
            ->groupBy('quiz_id')
            ->pluck('attempts_count', 'quiz_id');

        $plan            = $user->plan;
        $maxQuizAttempts = $plan && !$plan->unlimited_attempts ? $plan->quiz_attempts : null;
        $unlimited       = $plan?->unlimited_attempts ?? true;

        return response()->json([
            'course'              => $course,
            'enrollment'          => $enrollment,
            'lesson_progress'     => $lessonProgress,
            'passed_quizzes'      => $passedQuizzes,
            'unlocked_sections'   => $unlockedSections,
            'total_lessons'       => $totalLessons,
            'completed_lessons'   => $completedLessons,
            'trial_threshold'     => $trialThreshold,
            'attempts_per_quiz'   => $attemptsPerQuiz,
            'max_quiz_attempts'   => $maxQuizAttempts,
            'unlimited_attempts'  => $unlimited,
            'final_exam_unlocked' => $allContentCompleted,
        ]);
    }

    public function markLesson(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['trial', 'active', 'completed'])
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No estás inscrito.'], 403);
        }

        $progress = LessonProgress::firstOrCreate(
            ['user_id' => $user->id, 'lesson_id' => $lesson->id],
            [
                'enrollment_id' => $enrollment->id,
                'is_completed'  => true,
                'completed_at'  => now(),
            ]
        );

        if (!$progress->is_completed) {
            $progress->update(['is_completed' => true, 'completed_at' => now()]);
        }

        $totalLessons = $course->sections()
            ->where('is_presentation', false)
            ->where('is_final_exam', false)
            ->withCount('lessons')
            ->get()
            ->sum('lessons_count');

        $completedLessons = LessonProgress::where('user_id', $user->id)
            ->where('enrollment_id', $enrollment->id)
            ->where('is_completed', true)
            ->count();

        $trialThreshold = max(1, min(3, (int) ceil($totalLessons * 0.1)));

        return response()->json([
            'completed_lessons' => $completedLessons,
            'total_lessons'     => $totalLessons,
            'trial_threshold'   => $trialThreshold,
            'show_trial_prompt' => $enrollment->status === 'trial' && $completedLessons >= $trialThreshold,
        ]);
    }

    public function lesson(Request $request, Course $course, Lesson $lesson): JsonResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['trial', 'active', 'completed'])
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No estás inscrito.'], 403);
        }

        return response()->json([
            'lesson'     => $lesson->load('quiz.questions.options'),
            'enrollment' => $enrollment,
            'progress'   => LessonProgress::where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->first(),
        ]);
    }

    public function submitQuiz(Request $request, Course $course, Quiz $quiz): JsonResponse
{
    $user = $request->user();

    $enrollment = Enrollment::where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->whereIn('status', ['trial', 'active', 'completed'])
        ->first();

    if (!$enrollment) {
        return response()->json(['message' => 'No estás inscrito.'], 403);
    }

    $plan = $user->plan;
    if ($plan && !$plan->unlimited_attempts) {
        $attemptsUsed = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->where('enrollment_id', $enrollment->id)
            ->count();

        $maxAttempts = $quiz->type === 'exam'
            ? ($plan->exam_attempts ?? 1)
            : ($plan->quiz_attempts ?? 2);

        if ($attemptsUsed >= $maxAttempts) {
            return response()->json([
                'message'       => 'Alcanzaste el límite de intentos para este quiz.',
                'attempts_used' => $attemptsUsed,
                'max_attempts'  => $maxAttempts,
            ], 422);
        }
    }

    $request->validate([
        'answers'                      => 'required|array',
        'answers.*.question_id'        => 'required|exists:quiz_questions,id',
        'answers.*.selected_option_id' => 'required|exists:quiz_options,id',
    ]);

    $questions = $quiz->questions()->with('options')->get();
    $correct   = 0;

    $attempt = QuizAttempt::create([
        'user_id'       => $user->id,
        'quiz_id'       => $quiz->id,
        'enrollment_id' => $enrollment->id,
        'score'         => 0,
        'passed'        => false,
        'completed_at'  => now(),
    ]);

    foreach ($request->answers as $answer) {
        $option    = \App\Models\QuizOption::find($answer['selected_option_id']);
        $isCorrect = $option?->is_correct ?? false;
        if ($isCorrect) $correct++;

        QuizAttemptAnswer::create([
            'attempt_id'         => $attempt->id,
            'question_id'        => $answer['question_id'],
            'selected_option_id' => $answer['selected_option_id'],
            'is_correct'         => $isCorrect,
        ]);
    }

    $score  = $questions->count() > 0
        ? round(($correct / $questions->count()) * 100)
        : 0;
    $passed = $score >= $quiz->passing_score;

    $attempt->update(['score' => $score, 'passed' => $passed]);

    // Si aprobó el examen final, marcar enrollment como completado y generar certificado
    if ($passed && $quiz->type === 'exam') {
        $enrollment->update([
            'status'       => 'completed',
            'completed_at' => now(),
        ]);

        \App\Models\Certificate::firstOrCreate(
            [
                'user_id'       => $user->id,
                'course_id'     => $course->id,
                'enrollment_id' => $enrollment->id,
            ],
            [
                'certificate_code' => strtoupper(\Illuminate\Support\Str::random(4)) . '-' . strtoupper(\Illuminate\Support\Str::random(4)) . '-' . $user->id,
                'issued_at'        => now(),
            ]
        );
    }

    $attemptsUsed = QuizAttempt::where('user_id', $user->id)
        ->where('quiz_id', $quiz->id)
        ->where('enrollment_id', $enrollment->id)
        ->count();

    $maxAttempts = null;
    if ($plan && !$plan->unlimited_attempts) {
        $maxAttempts = $quiz->type === 'exam'
            ? ($plan->exam_attempts ?? 1)
            : ($plan->quiz_attempts ?? 2);
    }

    return response()->json([
        'score'         => $score,
        'passed'        => $passed,
        'correct'       => $correct,
        'total'         => $questions->count(),
        'passing_score' => $quiz->passing_score,
        'attempts_used' => $attemptsUsed,
        'max_attempts'  => $maxAttempts,
        'unlimited'     => $plan?->unlimited_attempts ?? true,
    ]);
}

    public function exam(Request $request, Course $course): JsonResponse
    {
        $user = $request->user();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['trial', 'active', 'completed'])
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No estás inscrito.'], 403);
        }

        $examSection = $course->sections()->where('is_final_exam', true)->first();
        if (!$examSection) {
            return response()->json(['message' => 'Este curso no tiene examen final.'], 404);
        }

        $examLesson = $examSection->lessons()->first();
        if (!$examLesson) {
            return response()->json(['message' => 'El examen final no está disponible.'], 404);
        }

        $examQuiz = Quiz::where('lesson_id', $examLesson->id)
            ->where('type', 'exam')
            ->with('questions.options')
            ->first();

        if (!$examQuiz) {
            return response()->json(['message' => 'El examen final no está disponible.'], 404);
        }

        $alreadyPassed = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $examQuiz->id)
            ->where('enrollment_id', $enrollment->id)
            ->where('passed', true)
            ->exists();

        $plan         = $user->plan;
        $attemptsUsed = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $examQuiz->id)
            ->where('enrollment_id', $enrollment->id)
            ->count();

        $maxAttempts = null;
        $unlimited   = $plan?->unlimited_attempts ?? true;

        if ($plan && !$plan->unlimited_attempts) {
            $maxAttempts = $plan->exam_attempts ?? 1;
        }

        $bestAttempt = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $examQuiz->id)
            ->where('enrollment_id', $enrollment->id)
            ->orderBy('score', 'desc')
            ->first();

        return response()->json([
            'course'         => $course->only(['id', 'title']),
            'enrollment'     => $enrollment,
            'quiz'           => $examQuiz,
            'attempts_used'  => $attemptsUsed,
            'max_attempts'   => $maxAttempts,
            'unlimited'      => $unlimited,
            'best_attempt'   => $bestAttempt,
            'already_passed' => $alreadyPassed,
            'can_attempt'    => !$alreadyPassed && ($unlimited || $maxAttempts === null || $attemptsUsed < $maxAttempts),
        ]);
    }
}