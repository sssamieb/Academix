import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['./admin-reviews.component.scss'],
})
export class AdminReviewsComponent implements OnInit {
  reviews:      any[] = [];
  isLoading     = true;
  searchQuery   = '';
  filterRating: number | null = null;
  selectedCourse = 'all';
  courses:      any[] = [];
  private searchTimeout: any;

  constructor(
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.reviewService.getAdminReviews().subscribe({
      next: (res) => {
        this.reviews   = res.reviews;
        this.isLoading = false;

        // Extraer cursos únicos
        const seen = new Set();
        this.courses = this.reviews
          .map((r: any) => r.course)
          .filter((c: any) => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });

        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  get filteredReviews(): any[] {
    let reviews = this.reviews;

    if (this.selectedCourse !== 'all') {
      reviews = reviews.filter(r => r.course?.id === Number(this.selectedCourse));
    }

    if (this.filterRating !== null) {
      reviews = reviews.filter(r => r.rating === this.filterRating);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      reviews = reviews.filter(r =>
        r.user?.name?.toLowerCase().includes(q) ||
        r.course?.title?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    }

    return reviews;
  }

  selectCourse(id: string): void {
    this.selectedCourse = id;
    this.filterRating   = null;
    this.searchQuery    = '';
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.cdr.detectChanges(), 300);
  }

  setFilter(rating: number | null): void {
    this.filterRating = this.filterRating === rating ? null : rating;
  }

  async deleteReview(review: any): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar reseña?',
      html: `Reseña de <strong>${review.user?.name}</strong> sobre <strong>${review.course?.title}</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });

    if (!result.isConfirmed) return;

    this.reviewService.deleteReview(review.id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id !== review.id);
        this.cdr.detectChanges();
        Swal.fire({
          title: 'Eliminada',
          text: 'La reseña fue eliminada.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: () => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar la reseña.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  getStarClass(star: number, rating: number): string {
    return star <= rating ? 'bi-star-fill' : 'bi-star';
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

  getCourseReviewCount(courseId: number): number {
    return this.reviews.filter(r => r.course?.id === courseId).length;
  }

  get avgRating(): number | null {
    const r = this.filteredReviews;
    if (!r.length) return null;
    return Math.round((r.reduce((acc, rv) => acc + rv.rating, 0) / r.length) * 10) / 10;
  }

  get totalByRating(): Record<number, number> {
    return [1,2,3,4,5].reduce((acc, s) => {
      acc[s] = this.filteredReviews.filter(r => r.rating === s).length;
      return acc;
    }, {} as Record<number, number>);
  }

  isPremium(user: any): boolean {
    return user?.plan?.type === 'premium';
  }
}