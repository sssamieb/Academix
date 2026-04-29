import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { InstructorCourseService, Course } from '../../../core/services/instructor-course.service';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class InstructorDashboardComponent implements OnInit {
  today = new Date();

  stats = { students: 0, courses: 0, rating: '—', earnings: '—' };

  courses:    Course[] = [];
  isLoading = true;

  recentActivity = [
    { name: 'Ana López',    action: 'se inscribió en tu curso',        time: 'Hace 5 min',   initials: 'AL', color: '#4F46E5' },
    { name: 'Pedro García', action: 'completó una lección',            time: 'Hace 20 min',  initials: 'PG', color: '#10B981' },
    { name: 'María Torres', action: 'dejó una reseña de 5 estrellas', time: 'Hace 1 hora',  initials: 'MT', color: '#F59E0B' },
    { name: 'Luis Martín',  action: 'hizo una pregunta en el foro',   time: 'Hace 2 horas', initials: 'LM', color: '#EF4444' },
  ];

  recentReviews = [
    { name: 'Ana López',    course: 'Angular & TypeScript desde cero', rating: 5, text: 'Excelente curso, muy completo y bien explicado.',          date: 'Hace 2 días', initials: 'AL', color: '#4F46E5' },
    { name: 'Carlos Ruiz',  course: 'Laravel API REST completo',        rating: 5, text: 'El mejor curso de Laravel que he tomado.',                 date: 'Hace 3 días', initials: 'CR', color: '#06B6D4' },
    { name: 'María García', course: 'MySQL para desarrolladores',       rating: 4, text: 'Muy buen contenido. Me gustaría más ejercicios prácticos.', date: 'Hace 5 días', initials: 'MG', color: '#10B981' },
  ];

  // Colores e iconos por categoría para mantener el diseño
  private categoryColors: Record<string, string> = {
    'Desarrollo Web':     '#4F46E5',
    'Backend':            '#EF4444',
    'Base de Datos':      '#F59E0B',
    'DevOps':             '#06B6D4',
    'Diseño':             '#EC4899',
    'Móvil':              '#8B5CF6',
    'Data Science':       '#10B981',
    'Seguridad':          '#F97316',
    'default':            '#64748B',
  };

  private categoryIcons: Record<string, string> = {
    'Desarrollo Web':     'bi-code-slash',
    'Backend':            'bi-server',
    'Base de Datos':      'bi-database-fill',
    'DevOps':             'bi-box-seam',
    'Diseño':             'bi-palette-fill',
    'Móvil':              'bi-phone-fill',
    'Data Science':       'bi-graph-up',
    'Seguridad':          'bi-shield-lock-fill',
    'default':            'bi-mortarboard-fill',
  };

  constructor(
    private courseService: InstructorCourseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses   = res.courses;
        this.isLoading = false;

        // Actualizar stats reales
        this.stats.courses  = this.courses.length;
        this.stats.students = this.courses.reduce(
          (acc, c) => acc + (c.enrollments_count ?? 0), 0
        );

        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  getCourseColor(course: Course): string {
    const cat = course.category?.name ?? 'default';
    return this.categoryColors[cat] ?? this.categoryColors['default'];
  }

  getCourseIcon(course: Course): string {
    const cat = course.category?.name ?? 'default';
    return this.categoryIcons[cat] ?? this.categoryIcons['default'];
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      draft:       'Borrador',
      in_review:   'En revisión',
      rejected:    'Rechazado',
      published:   'Publicado',
      unpublished: 'Despublicado',
    };
    return map[status] ?? status;
  }

  goToMyCourses(): void { this.router.navigate(['/instructor/courses']); }
  goToEdit(id: number): void { this.router.navigate(['/instructor/courses', id, 'edit']); }

  getStars(rating: number):      number[] { return Array(Math.floor(rating)).fill(0); }
  getEmptyStars(rating: number): number[] { return Array(5 - Math.floor(rating)).fill(0); }
}