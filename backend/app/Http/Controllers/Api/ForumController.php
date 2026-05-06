<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ForumPost;
use App\Models\ForumReply;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ForumController extends Controller
{
    // Listar posts del foro de un curso
    public function index(Request $request, Course $course): JsonResponse
{
    $user = $request->user();
    $isInstructor = $course->instructor_id === $user->id;

    // Verificar que está inscrito O es el instructor del curso
    if (!$isInstructor) {
        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['trial', 'active', 'completed'])
            ->first();

        if (!$enrollment) {
            return response()->json(['message' => 'No estás inscrito en este curso.'], 403);
        }
    }

    $posts = ForumPost::where('course_id', $course->id)
        ->with(['user:id,name,avatar_color', 'replies.user:id,name,avatar_color'])
        ->orderBy('is_pinned', 'desc')
        ->orderBy('created_at', 'desc')
        ->get();

    $plan    = $user->plan;
    $canPost = $isInstructor || $plan?->type === 'premium';

    return response()->json([
        'posts'         => $posts,
        'can_post'      => $canPost,
        'is_instructor' => $isInstructor,
    ]);
}
    // Crear post
    public function store(Request $request, Course $course): JsonResponse
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
        $isInstructor = $course->instructor_id === $user->id;

        if (!$isInstructor && $plan?->type !== 'premium') {
            return response()->json(['message' => 'Necesitás el plan Premium para publicar en el foro.'], 403);
        }

        $request->validate(['content' => 'required|string|min:5|max:1000']);

        $post = ForumPost::create([
            'course_id' => $course->id,
            'user_id'   => $user->id,
            'content'   => $request->content,
        ]);

        $post->load('user:id,name,avatar_color');

        return response()->json(['post' => $post], 201);
    }

    // Responder un post
    public function reply(Request $request, Course $course, ForumPost $post): JsonResponse
    {
        $user = $request->user();

        $isInstructor = $course->instructor_id === $user->id;

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->whereIn('status', ['trial', 'active', 'completed'])
            ->first();

        if (!$enrollment && !$isInstructor) {
            return response()->json(['message' => 'No tenés acceso a este foro.'], 403);
        }

        $plan = $user->plan;
        if (!$isInstructor && $plan?->type !== 'premium') {
            return response()->json(['message' => 'Necesitás el plan Premium para responder.'], 403);
        }

        $request->validate(['content' => 'required|string|min:1|max:1000']);

        $reply = ForumReply::create([
            'post_id' => $post->id,
            'user_id' => $user->id,
            'content' => $request->content,
        ]);

        $reply->load('user:id,name,avatar_color');

        return response()->json(['reply' => $reply], 201);
    }

    // Eliminar post (solo el autor o instructor)
    public function destroyPost(Request $request, Course $course, ForumPost $post): JsonResponse
    {
        $user = $request->user();

        if ($post->user_id !== $user->id && $course->instructor_id !== $user->id) {
            return response()->json(['message' => 'No tenés permiso.'], 403);
        }

        $post->delete();

        return response()->json(['message' => 'Post eliminado.']);
    }

    // Eliminar reply (solo el autor o instructor)
    public function destroyReply(Request $request, Course $course, ForumReply $reply): JsonResponse
    {
        $user = $request->user();

        if ($reply->user_id !== $user->id && $course->instructor_id !== $user->id) {
            return response()->json(['message' => 'No tenés permiso.'], 403);
        }

        $reply->delete();

        return response()->json(['message' => 'Respuesta eliminada.']);
    }
}