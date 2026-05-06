import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ← agregar este import
import { ReviewService } from '../../../core/services/review.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-instructor-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule], // ← agregar FormsModule acá
  templateUrl: './instructor-reviews.component.html',
  styleUrls: ['./instructor-reviews.component.scss'],
})
export class InstructorReviewsComponent implements OnInit {
  reviews:   any[]        = [];
  avgRating: number | null = null;
  total      = 0;
  isLoading  = true;

  selectedCourse: string = 'all';
  courses: any[] = [];

  constructor(
    private reviewService: ReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.reviewService.getInstructorReviews().subscribe({
      next: (res) => {
        this.reviews   = res.reviews;
        this.avgRating = res.avg_rating;
        this.total     = res.total;
        this.isLoading = false;

        // Extraer cursos únicos para el filtro
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
    if (this.selectedCourse === 'all') return this.reviews;
    return this.reviews.filter(r => r.course?.id === Number(this.selectedCourse));
  }

  get filteredAvg(): number | null {
    const filtered = this.filteredReviews;
    if (!filtered.length) return null;
    return Math.round((filtered.reduce((acc, r) => acc + r.rating, 0) / filtered.length) * 10) / 10;
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

  getRatingCount(stars: number): number {
    return this.filteredReviews.filter(r => r.rating === stars).length;
  }

  getRatingPercent(stars: number): number {
    if (!this.filteredReviews.length) return 0;
    return Math.round((this.getRatingCount(stars) / this.filteredReviews.length) * 100);
  }
  getCourseReviewCount(courseId: number): number {
    return this.reviews.filter(r => r.course?.id === courseId).length;
  }

  isPremium(user: any): boolean {
    return user?.plan?.type === 'premium';
  }
}