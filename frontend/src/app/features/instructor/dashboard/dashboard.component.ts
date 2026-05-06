import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { InstructorCourseService, Course } from '../../../core/services/instructor-course.service';
import { ReviewService } from '../../../core/services/review.service';

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class InstructorDashboardComponent implements OnInit {
  today = new Date();

  stats = { students: 0, courses: 0, published: 0, avgRating: '—' };

  courses:      Course[] = [];
  recentReviews: any[]   = [];
  isLoading     = true;
  isLoadingReviews = true;

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
    private reviewService: ReviewService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadReviews();
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses   = res.courses;
        this.isLoading = false;

        this.stats.courses   = this.courses.length;
        this.stats.published = this.courses.filter(c => c.status === 'published').length;
        this.stats.students  = this.courses.reduce(
          (acc, c) => acc + (c.enrollments_count ?? 0), 0
        );

        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadReviews(): void {
    this.reviewService.getInstructorReviews().subscribe({
      next: (res) => {
        this.recentReviews   = res.reviews.slice(0, 3);
        this.isLoadingReviews = false;

        if (res.avg_rating) {
          this.stats.avgRating = res.avg_rating.toString();
        }

        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingReviews = false; }
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

  getTimeAgo(dateStr: string): string {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days > 0)  return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (mins > 0)  return `hace ${mins}min`;
    return 'ahora mismo';
  }

  getInitials(name: string): string {
    return name?.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';
  }

  getStars(rating: number):      number[] { return Array(Math.floor(rating)).fill(0); }
  getEmptyStars(rating: number): number[] { return Array(5 - Math.floor(rating)).fill(0); }

  goToMyCourses(): void  { this.router.navigate(['/instructor/courses']); }
  goToEdit(id: number):void { this.router.navigate(['/instructor/courses', id, 'edit']); }
  goToForum(): void      { this.router.navigate(['/instructor/forum']); }
  goToReviews(): void    { this.router.navigate(['/instructor/reviews']); }
  goToCreate(): void     { this.router.navigate(['/instructor/courses/create']); }
}