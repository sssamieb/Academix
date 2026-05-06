import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CourseService } from '../../../core/services/course.service';
import { User } from '../../../core/models/user.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.scss'],
})
export class StudentProfileComponent implements OnInit {
  user: User | null = null;
  enrollments: any[] = [];
  isLoading    = true;
  savingColor  = false;

  selectedColor = '#4F46E5';


  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.refreshUser().subscribe({
      next: (user) => {
        this.user          = user;
        this.selectedColor = user.avatar_color ?? '#4F46E5';
        this.cdr.detectChanges();
      }
    });

    this.courseService.getMyEnrollments().subscribe({
      next: (res) => {
        this.enrollments = res.enrollments;
        this.isLoading   = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  get isPremium(): boolean {
    return this.user?.plan?.type === 'premium' &&
           this.user?.subscription_status === 'active';
  }

  get completedCourses(): any[] {
    return this.enrollments.filter(e => e.status === 'completed');
  }

  get inProgressCourses(): any[] {
    return this.enrollments.filter(e =>
      e.status === 'active' || e.status === 'trial'
    );
  }

  get initials(): string {
    if (!this.user?.name) return 'E';
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  get memberSince(): string {
    if (!this.user?.created_at) return '';
    return new Date(this.user.created_at).toLocaleDateString('es-ES', {
      month: 'long', year: 'numeric'
    });
  }

onColorChange(event: Event): void {
  const input = event.target as HTMLInputElement;
  this.selectedColor = input.value;
}

  saveColor(): void {
    if (this.savingColor) return;
    this.savingColor = true;

    this.authService.updateProfile({ avatar_color: this.selectedColor }).subscribe({
      next: (res) => {
        this.user        = res.user;
        this.savingColor = false;
        Swal.fire({
          title: '¡Guardado!',
          text: 'Tu color de perfil fue actualizado.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingColor = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar el color.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  getCategoryColor(categoryName: string): string {
    const colors: Record<string, string> = {
      'Desarrollo Web':         '#4F46E5',
      'Apps Móviles':           '#8B5CF6',
      'Inteligencia Artificial':'#06B6D4',
      'Diseño UX/UI':           '#EC4899',
      'Data Science':           '#F59E0B',
      'Ciberseguridad':         '#EF4444',
      'DevOps':                 '#10B981',
      'Base de datos':          '#F97316',
      'Programación':           '#3B82F6',
    };
    return colors[categoryName] ?? '#64748B';
  }

  goToCourse(id: number): void {
    this.router.navigate(['/student/my-courses', id]);
  }
}