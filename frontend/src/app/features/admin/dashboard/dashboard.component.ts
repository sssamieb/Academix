import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class AdminDashboardComponent {
  today = new Date();

  stats = {
    students:    1248,
    instructors: 37,
    courses:     214,
    revenue:     '12,450',
  };

  recentActivity = [
    { type: 'student',    text: 'Nuevo estudiante registrado: Ana López',      time: 'Hace 5 min'   },
    { type: 'course',     text: 'Curso "React Avanzado" publicado',            time: 'Hace 20 min'  },
    { type: 'instructor', text: 'Instructor Carlos Ruiz verificado',           time: 'Hace 1 hora'  },
    { type: 'payment',    text: 'Pago recibido: Plan Pro - $24.99',           time: 'Hace 2 horas' },
    { type: 'student',    text: 'Nuevo estudiante registrado: Juan Martínez', time: 'Hace 3 horas' },
  ];

  recentUsers = [
    { name: 'Ana López',     email: 'ana@email.com',    role: 'student',    roleLabel: 'Estudiante', active: true,  date: 'Hoy',         initials: 'AL', color: '#4F46E5' },
    { name: 'Carlos Ruiz',   email: 'carlos@email.com', role: 'instructor', roleLabel: 'Instructor', active: true,  date: 'Hoy',         initials: 'CR', color: '#06B6D4' },
    { name: 'María García',  email: 'maria@email.com',  role: 'student',    roleLabel: 'Estudiante', active: true,  date: 'Ayer',        initials: 'MG', color: '#10B981' },
    { name: 'Pedro Sánchez', email: 'pedro@email.com',  role: 'student',    roleLabel: 'Estudiante', active: false, date: 'Hace 2 días', initials: 'PS', color: '#F59E0B' },
    { name: 'Laura Torres',  email: 'laura@email.com',  role: 'instructor', roleLabel: 'Instructor', active: true,  date: 'Hace 3 días', initials: 'LT', color: '#EF4444' },
  ];

  constructor(private router: Router) {}

  goToRegisterInstructor(): void { this.router.navigate(['/admin/register-instructor']); }
  goToCourses(): void { this.router.navigate(['/admin/courses']); }
}