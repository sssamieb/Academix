<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = config('app.frontend_url') . '/auth/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('🔐 Recuperar contraseña - Academix')
            ->greeting('¡Hola, ' . $notifiable->name . '!')
            ->line('Recibimos una solicitud para restablecer la contraseña de tu cuenta en **Academix**.')
            ->line('Haz click en el botón para crear una nueva contraseña:')
            ->action('🔐 Restablecer mi contraseña', $url)
            ->line('⚠️ Este enlace expirará en **60 minutos**.')
            ->line('Si no solicitaste restablecer tu contraseña, ignora este correo. Tu cuenta está segura.')
            ->salutation('Saludos, el equipo de Academix 🎓');
    }
}