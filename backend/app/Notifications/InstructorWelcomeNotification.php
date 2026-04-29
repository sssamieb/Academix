<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InstructorWelcomeNotification extends Notification
{
    use Queueable;

    public function __construct(
        private string $temporaryPassword,
        private string $verificationUrl
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('🎓 Bienvenido a Academix - Tu cuenta de instructor')
            ->greeting('¡Hola, ' . $notifiable->name . '!')
            ->line('El administrador de **Academix** te ha registrado como **Instructor**.')
            ->line('---')
            ->line('**Tus credenciales de acceso:**')
            ->line('📧 **Correo:** ' . $notifiable->email)
            ->line('🔑 **Contraseña temporal:** `' . $this->temporaryPassword . '`')
            ->line('---')
            ->line('Para comenzar, primero debes verificar tu correo haciendo click en el botón:')
            ->action('✅ Verificar mi correo', $this->verificationUrl)
            ->line('Una vez verificado, inicia sesión y el sistema te pedirá que cambies tu contraseña temporal.')
            ->line('⚠️ Por seguridad, cambia tu contraseña en tu primer inicio de sesión.')
            ->line('Este enlace de verificación expirará en 60 minutos.')
            ->salutation('Saludos, el equipo de Academix 🎓');
    }
}