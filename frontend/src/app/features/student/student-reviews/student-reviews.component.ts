import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReviewService } from '../../../core/services/review.service';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-reviews.component.html',
  styleUrls: ['./student-reviews.component.scss'],
})
export class StudentReviewsComponent implements OnInit {
  courseId!:  number;
  course:     any    = null;
  reviews:    any[]  = [];
  avgRating:  number | null = null;
  totalReviews = 0;
  isLoading    = true;

  // Estado del estudiante
  canReview        = false;
  alreadyReviewed  = false;
  enrollmentStatus = '';

  // Formulario
  newRating   = 0;
  hoverRating = 0;
  newComment  = '';
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private reviewService: ReviewService,
    private courseService: CourseService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  loadData(): void {
    // Cargar reseñas y curso en paralelo
    this.reviewService.getReviews(this.courseId).subscribe({
      next: (res) => {
        this.reviews      = res.reviews;
        this.avgRating    = res.avg_rating;
        this.totalReviews = res.total;

        // Verificar si ya dejó reseña
        const user = this.authService.currentUser();
        if (user) {
          this.alreadyReviewed = this.reviews.some((r: any) => r.user_id === user.id);
        }

        // Cargar info del enrollment
        this.courseService.checkEnrollment(this.courseId).subscribe({
          next: (r) => {
            this.enrollmentStatus = r.status ?? '';
            this.canReview = r.status === 'completed' && !this.alreadyReviewed;
            this.cdr.detectChanges();
          }
        });

        // Cargar info del curso
        this.courseService.getStudentCourse(this.courseId).subscribe({
          next: (r) => {
            this.course    = r.course;
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.isLoading = false; }
        });

        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  setRating(r: number):  void { this.newRating   = r; }
  setHover(r: number):   void { this.hoverRating  = r; }
  clearHover():          void { this.hoverRating  = 0; }

  getStarClass(star: number): string {
    return star <= (this.hoverRating || this.newRating) ? 'bi-star-fill' : 'bi-star';
  }

  getReviewStarClass(star: number, rating: number): string {
    return star <= rating ? 'bi-star-fill' : 'bi-star';
  }

  getRatingLabel(): string {
    return ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'][this.newRating] ?? '';
  }

  submitReview(): void {
    if (!this.newRating || this.isSubmitting) return;
    this.isSubmitting = true;

    this.reviewService.submitReview(this.courseId, this.newRating, this.newComment).subscribe({
      next: (res) => {
        this.reviews.unshift(res.review);
        this.alreadyReviewed = true;
        this.canReview       = false;
        this.totalReviews++;
        this.newRating       = 0;
        this.newComment      = '';
        this.isSubmitting    = false;

        // Recalcular promedio
        const sum = this.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
        this.avgRating = Math.round((sum / this.reviews.length) * 10) / 10;

        Swal.fire({
          title: '¡Gracias por tu reseña!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSubmitting = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo enviar la reseña.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';
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

  isPremium(user: any): boolean {
    return user?.plan?.type === 'premium';
  }

  goBack(): void {
    this.router.navigate(['/student/my-courses', this.courseId]);
  }
}