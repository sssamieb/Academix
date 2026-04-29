<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\InstructorWelcomeNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;



class InstructorController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'  => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
        ]);

        $temporaryPassword = Str::random(10);

        $user = User::create([
            'name'                 => $request->name,
            'email'                => $request->email,
            'password'             => Hash::make($temporaryPassword),
            'role'                 => 'instructor',
            'is_active'            => true,
            'must_change_password' => true,
        ]);

        // Generar URL de verificación
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $backendUrl = URL::temporarySignedRoute(
    'verification.verify',
    Carbon::now()->addMinutes(60),
    [
        'id'   => $user->id,
        'hash' => sha1($user->getEmailForVerification()),
    ]
);

parse_str(parse_url($backendUrl, PHP_URL_QUERY), $params);

$verificationUrl = env('FRONTEND_URL', 'http://localhost:4200')
    . '/auth/verify-email-confirm?'
    . http_build_query([
        'id'        => $user->id,
        'hash'      => sha1($user->getEmailForVerification()),
        'expires'   => $params['expires'],
        'signature' => $params['signature'],
    ]);

$user->notify(new InstructorWelcomeNotification($temporaryPassword, $verificationUrl));

        // Enviar email de bienvenida con contraseña temporal
        $user->notify(new InstructorWelcomeNotification(
            $temporaryPassword,
            $verificationUrl
        ));

        return response()->json([
            'message' => "Instructor registrado. Se envió un correo con las credenciales a {$user->email}.",
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ], 201);
    }

    public function index(): JsonResponse
    {
        $instructors = User::where('role', 'instructor')
            ->select('id', 'name', 'email', 'is_active', 'created_at')
            ->get();

        return response()->json([
            'instructors' => $instructors,
        ]);
    }
}