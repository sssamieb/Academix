<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends VerifyEmail
{
    /**
     * Reemplaza la URL del botón para que apunte al frontend Angular
     * en vez del endpoint de Laravel directamente.
     */
    protected function verificationUrl($notifiable): string
    {
        // Generamos la URL firmada de Laravel (la necesitamos para expires y signature)
        $backendUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        // Extraemos los query params que genera Laravel (expires y signature)
        parse_str(parse_url($backendUrl, PHP_URL_QUERY), $params);

        // Armamos la URL del frontend con todos los params que Angular necesita
        return env('FRONTEND_URL', 'http://localhost:4200')
            . '/verify-email-confirm?'
            . http_build_query([
                'id'        => $notifiable->getKey(),
                'hash'      => sha1($notifiable->getEmailForVerification()),
                'expires'   => $params['expires'],
                'signature' => $params['signature'],
            ]);
    }

    protected function buildMailMessage($url): MailMessage
    {
        return (new MailMessage)
            ->subject('✅ Verifica tu correo - Academix')
            ->greeting('¡Hola!')
            ->line('Gracias por registrarte en **Academix**.')
            ->line('Por favor haz click en el botón para verificar tu correo electrónico.')
            ->action('Verificar mi correo', $url)
            ->line('Este enlace expirará en 60 minutos.')
            ->line('Si no creaste una cuenta en Academix, ignora este correo.')
            ->salutation('Saludos, el equipo de Academix 🎓');
    }
}