<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // US-01: Registro público el primero siempre es admin, el resto student
    public function register(RegisterRequest $request): JsonResponse
{
    // Si no hay ningún usuario todavía, el primero es admin
    $isFirstUser = User::count() === 0;

    $user = User::create([
        'name'                 => $request->name,
        'email'                => $request->email,
        'password'             => Hash::make($request->password),
        'role'                 => $isFirstUser ? 'admin' : 'student',
        'is_active'            => true,
        'must_change_password' => false,
        'email_verified_at'    => $isFirstUser ? now() : null,
    ]);

    if (!$isFirstUser) {
        event(new Registered($user));
    }

    $message = $isFirstUser
        ? 'Cuenta de administrador creada exitosamente.'
        : 'Registro exitoso. Por favor revisa tu correo para verificar tu cuenta.';

    return response()->json(['message' => $message], 201);
}
    

    // US-02: Login
    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Credenciales incorrectas.',
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Tu cuenta está suspendida. Contacta al administrador.',
            ], 403);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Debes verificar tu correo electrónico antes de iniciar sesión.',
                'email_verified' => false,
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'             => 'Inicio de sesión exitoso.',
            'must_change_password' => $user->must_change_password,
            'user'                => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            'token'      => $token,
            'token_type' => 'Bearer',
        ]);
    }

    // Logout
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }

    // Usuario autenticado
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('plan'),
        ]);
    }

    // Reenviar email de verificación
    public function resendVerification(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'El correo ya fue verificado.',
            ], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Correo de verificación reenviado.',
        ]);
    }

    // Verificar email con el link del correo
    public function verifyEmail(Request $request, $id, $hash): JsonResponse
{
    $user = User::findOrFail($id);

    if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
        return response()->json(['message' => 'Link de verificación inválido.'], 400);
    }

    // Validar expiración manualmente
    $expires = $request->query('expires');
    if ($expires && now()->timestamp > (int) $expires) {
        return response()->json(['message' => 'El link de verificación ha expirado.'], 400);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'El correo ya fue verificado.']);
    }

    $user->markEmailAsVerified();

    return response()->json(['message' => 'Correo verificado exitosamente. Ya puedes iniciar sesión.']);
}

    // US-03: Recuperar contraseña
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $status = PasswordBroker::sendResetLink(
            $request->only('email')
        );

        if ($status === PasswordBroker::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Se envió un enlace de recuperación a tu correo.',
            ]);
        }

        return response()->json([
            'message' => 'No se pudo enviar el enlace. Intenta de nuevo.',
        ], 500);
    }

    // US-03: Resetear contraseña
    public function resetPassword(Request $request): JsonResponse
{
    $request->validate([
        'token'    => 'required',
        'email'    => 'required|email',
        'password' => [
            'required',
            'confirmed',
            Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()
        ],
    ], [
        'password.min'     => 'La contraseña debe tener al menos 8 caracteres.',
        'password.mixed'   => 'La contraseña debe tener mayúsculas y minúsculas.',
        'password.numbers' => 'La contraseña debe incluir al menos un número.',
        'password.symbols' => 'La contraseña debe incluir al menos un carácter especial.',
    ]);

        $status = PasswordBroker::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'             => Hash::make($password),
                    'must_change_password' => false,
                ])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            }
        );

        if ($status === PasswordBroker::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Contraseña restablecida exitosamente.',
            ]);
        }

        return response()->json([
            'message' => 'Token inválido o expirado.',
        ], 400);
    }

    // Cambiar contraseña temporal (instructores)
    public function changePassword(Request $request): JsonResponse
{
    $request->validate([
        'current_password' => 'required',
        'password'         => [
            'required',
            'confirmed',
            Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols()
        ],
    ], [
        'password.min'     => 'La contraseña debe tener al menos 8 caracteres.',
        'password.mixed'   => 'La contraseña debe tener mayúsculas y minúsculas.',
        'password.numbers' => 'La contraseña debe incluir al menos un número.',
        'password.symbols' => 'La contraseña debe incluir al menos un carácter especial.',
    ]);

    $user = $request->user();

    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json([
            'message' => 'La contraseña actual es incorrecta.',
        ], 400);
    }

    $user->forceFill([
        'password'             => Hash::make($request->password),
        'must_change_password' => false,
    ])->save();

    return response()->json([
        'message' => 'Contraseña actualizada exitosamente.',
    ]);

    
}

}