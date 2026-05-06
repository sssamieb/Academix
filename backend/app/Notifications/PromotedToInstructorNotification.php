<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PromotedToInstructorNotification extends Notification
{
    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('¡Ahora sos instructor en Academix!')
            ->greeting("¡Hola, {$notifiable->name}!")
            ->line('El equipo de Academix te ha promovido a instructor.')
            ->line('Ya podés acceder a tu panel de instructor y empezar a crear cursos.')
            ->action('Ir a Academix', url('http://localhost:4200/instructor/dashboard'))
            ->line('¡Bienvenido al equipo de instructores!');
    }
}