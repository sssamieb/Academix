import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class StudentDashboardComponent implements OnInit {
  user: User | null;
  isLoading = true;

  // Datos reales
  enrollments: any[] = [];
  suggestedCourses: any[] = [];

  stats = {
    enrolled:   0,
    completed:  0,
    inProgress: 0,
    hours:      '0',
  };

  private categoryColors: Record<string, string> = {
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

  private categoryIcons: Record<string, string> = {
    'Desarrollo Web':         'bi-code-slash',
    'Apps Móviles':           'bi-phone-fill',
    'Inteligencia Artificial':'bi-cpu-fill',
    'Diseño UX/UI':           'bi-palette-fill',
    'Data Science':           'bi-graph-up',
    'Ciberseguridad':         '#EF4444',
    'DevOps':                 'bi-box-seam',
    'Base de datos':          'bi-database-fill',
    'Programación':           'bi-code-slash',
  };

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.currentUser();
  }

  ngOnInit(): void {
    this.loadEnrollments();
    this.loadSuggested();
  }

  loadEnrollments(): void {
    this.courseService.getMyEnrollments().subscribe({
      next: (res) => {
        this.enrollments = res.enrollments;
        this.isLoading   = false;

        // Calcular stats reales
        this.stats.enrolled   = this.enrollments.length;
        this.stats.completed  = this.enrollments.filter(e => e.status === 'completed').length;
        this.stats.inProgress = this.enrollments.filter(e => e.status === 'active' || e.status === 'trial').length;

        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadSuggested(): void {
    // Cargar cursos publicados como sugeridos (por ahora los últimos 3)
    this.courseService.getCourses().subscribe({
      next: (res) => {
        // Filtrar los que ya tiene inscritos
        const enrolledIds = this.enrollments.map(e => e.course_id);
        this.suggestedCourses = res.courses
          .filter(c => !enrolledIds.includes(c.id))
          .slice(0, 3);
        this.cdr.detectChanges();
      }
    });
  }

  getCourseColor(categoryName: string): string {
    return this.categoryColors[categoryName] ?? '#64748B';
  }

  getCourseIcon(categoryName: string): string {
    return this.categoryIcons[categoryName] ?? 'bi-mortarboard-fill';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      trial:     'Período de prueba',
      active:    'En progreso',
      completed: 'Completado',
      refunded:  'Reembolsado',
    };
    return map[status] ?? status;
  }

  goToPlans(): void    { this.router.navigate(['/student/plans']); }
goToCourse(id: number, enrolled = true): void {
  if (enrolled) {
    this.router.navigate(['/student/my-courses', id]);
  } else {
    this.router.navigate(['/student/courses', id]);
  }
}
  goToExplore(): void  { this.router.navigate(['/student/explore']); }

  getFirstName(): string {
    if (!this.user?.name) return '';
    return this.user.name.split(' ')[0];
  }

  
}