<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    // Redirige directo a Google
    public function redirectToGoogle(): \Illuminate\Http\RedirectResponse
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    // Callback de Google
    public function handleGoogleCallback(): \Illuminate\Http\RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')
                ->stateless()
                ->user();
        } catch (\Exception $e) {
            return redirect(
                config('app.frontend_url') .
                '/auth/login?error=Error al iniciar sesión con Google.'
            );
        }

        $user = User::where('email', $googleUser->getEmail())->first();

        if (!$user) {
            $user = User::create([
                'name'                 => $googleUser->getName(),
                'email'                => $googleUser->getEmail(),
                'password'             => Hash::make(Str::random(24)),
                'role'                 => 'student',
                'is_active'            => true,
                'email_verified_at'    => now(),
                'must_change_password' => false,
            ]);
        } else {
            if (!$user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }
        }

        if (!$user->is_active) {
            return redirect(
                config('app.frontend_url') .
                '/auth/login?error=Tu cuenta está suspendida.'
            );
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        $userData = urlencode(json_encode([
            'id'                   => $user->id,
            'name'                 => $user->name,
            'email'                => $user->email,
            'role'                 => $user->role,
            'must_change_password' => $user->must_change_password,
        ]));

        return redirect(
            config('app.frontend_url') .
            '/auth/social-callback?token=' . $token .
            '&user=' . $userData
        );
    }
}