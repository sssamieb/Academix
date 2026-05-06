import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, FormsModule],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
})
export class CourseDetailComponent implements OnInit {
  course:   any   = null;
  sections: any[] = [];
  isLoading = true;
  courseId!: number;
  isEnrolled     = false;
  refundEligible = false;
  isEnrolling    = false;
  expandedSections: Record<number, boolean> = {};

  // Reseñas
  reviews:      any[]        = [];
  avgRating:    number | null = null;
  totalReviews  = 0;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCourse();
    this.loadReviews();
  }

  loadCourse(): void {
    this.courseService.getCourse(this.courseId).subscribe({
      next: (res) => {
        this.course   = res.course;
        this.sections = res.course.sections ?? [];
        this.isLoading = false;
        this.getContentSections().forEach((_, i) => {
          this.expandedSections[i] = i === 0;
        });
        if (this.authService.isAuthenticated()) {
          this.checkEnrollment();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/student/explore']);
      }
    });
  }

  loadReviews(): void {
    this.reviewService.getReviews(this.courseId).subscribe({
      next: (res) => {
        this.reviews      = res.reviews;
        this.avgRating    = res.avg_rating;
        this.totalReviews = res.total;
        this.cdr.detectChanges();
      }
    });
  }

  checkEnrollment(): void {
    this.courseService.checkEnrollment(this.courseId).subscribe({
      next: (res) => {
        this.isEnrolled     = res.enrolled;
        this.refundEligible = res.refund_eligible;
        this.cdr.detectChanges();
      }
    });
  }

  isPremium(user: any): boolean {
    return user?.plan?.type === 'premium';
  }

  getReviewStarClass(star: number, rating: number): string {
    return star <= rating ? 'bi-star-fill' : 'bi-star';
  }

  getInitials(name: string): string {
    return name?.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';
  }

  getTimeAgo(dateStr: string): string {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const mins  = Math.floor(diff / 60000);
    if (days > 0)  return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (mins > 0)  return `hace ${mins}min`;
    return 'ahora mismo';
  }

  async enroll(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) { this.router.navigate(['/auth/login']); return; }

    if (!user.plan_id || user.subscription_status !== 'active') {
      const result = await Swal.fire({
        title: 'Necesitás un plan',
        text: 'Para inscribirte en cursos necesitás tener un plan activo.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Ver planes',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#4F46E5',
        cancelButtonColor: '#64748B',
      });
      if (result.isConfirmed) this.router.navigate(['/student/plans']);
      return;
    }

    if (!user.plan?.unlimited_tokens && user.tokens < this.course.token_price) {
      await Swal.fire({
        title: 'Tokens insuficientes',
        html: `Este curso cuesta <strong>${this.course.token_price} tokens</strong> y tenés <strong>${user.tokens} tokens</strong>.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ver planes',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#4F46E5',
        cancelButtonColor: '#64748B',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Inscribirte en este curso?',
      html: `Se descontarán <strong>${this.course.token_price} tokens</strong> de tu cuenta.<br>
             Tendrás un período de prueba para solicitar reembolso.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, inscribirme',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#64748B',
    });

    if (!result.isConfirmed) return;
    this.isEnrolling = true;

    this.courseService.enroll(this.courseId).subscribe({
      next: (res) => {
        this.isEnrolled     = true;
        this.refundEligible = true;
        this.isEnrolling    = false;
        this.authService.refreshUser().subscribe();
        Swal.fire({
          title: '¡Inscripción exitosa!',
          text: `Te quedan ${res.tokens_remaining} tokens.`,
          icon: 'success',
          confirmButtonText: 'Ir al curso',
          confirmButtonColor: '#4F46E5',
        }).then(() => {
          this.router.navigate(['/student/my-courses', this.courseId]);
        });
      },
      error: (err) => {
        this.isEnrolling = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo completar la inscripción.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  async requestRefund(): Promise<void> {
    const result = await Swal.fire({
      title: '¿Solicitar reembolso?',
      text: `Se te devolverán ${this.course.token_price} tokens y perderás acceso al curso.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quiero mis tokens de vuelta',
      cancelButtonText: 'Me quedo en el curso',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#4F46E5',
    });

    if (!result.isConfirmed) return;

    this.courseService.refund(this.courseId).subscribe({
      next: () => {
        this.isEnrolled     = false;
        this.refundEligible = false;
        this.authService.refreshUser().subscribe();
        Swal.fire({
          title: 'Reembolso exitoso',
          text: `Se devolvieron ${this.course.token_price} tokens a tu cuenta.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo procesar el reembolso.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  toggleSection(i: number): void { this.expandedSections[i] = !this.expandedSections[i]; }

  getContentSections(): any[] {
    return this.sections.filter(s => !s.is_presentation && !s.is_final_exam);
  }

  getPresentationSection(): any {
    return this.sections.find(s => s.is_presentation) ?? null;
  }

  getTotalLessons(): number {
    return this.getContentSections().reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0);
  }

  getTotalDuration(): string {
    const total = this.getContentSections()
      .flatMap(s => s.lessons ?? [])
      .reduce((acc: number, l: any) => acc + (l.duration ?? 0), 0);
    if (total === 0) return '';
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m} min`;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  get shortDescription(): string { return this.course?.short_description ?? ''; }
  goBack(): void { this.router.navigate(['/student/explore']); }
  goToCourse(): void { this.router.navigate(['/student/courses', this.courseId]); }
}