import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminCourseReviewService, ReviewCourse } from '../../../core/services/admin-course-review.service';

@Component({
  selector: 'app-course-review',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './course-review.component.html',
  styleUrls: ['./course-review.component.scss'],
})
export class CourseReviewComponent implements OnInit {
  courses:   ReviewCourse[] = [];
  isLoading = true;
  filter    = 'in_review';

  // Panel de aprobación
  approvePanel: ReviewCourse | null = null;
  approveForm!: FormGroup;
  isApproving = false;

  // Panel de rechazo
  rejectPanel: ReviewCourse | null = null;
  rejectReason = '';
  isRejecting  = false;

  errorMessage   = '';
  successMessage = '';

  statusLabels: Record<string, string> = {
    in_review:   'En revisión',
    published:   'Publicado',
    rejected:    'Rechazado',
    unpublished: 'Despublicado',
  };

  constructor(
    private reviewService: AdminCourseReviewService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.reviewService.getCourses().subscribe({
      next: (res) => {
        this.courses   = res.courses;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  get filteredCourses(): ReviewCourse[] {
    if (this.filter === 'all') return this.courses;
    return this.courses.filter(c => c.status === this.filter);
  }

  setFilter(f: string): void { this.filter = f; }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      in_review:   'badge-review',
      published:   'badge-published',
      rejected:    'badge-rejected',
      unpublished: 'badge-unpublished',
    };
    return map[status] ?? '';
  }

  // ===== APROBAR =====
  openApprovePanel(course: ReviewCourse): void {
    this.approvePanel  = course;
    this.rejectPanel   = null;
    this.errorMessage  = '';
    this.approveForm   = this.fb.group({
      token_price:     [100, [Validators.required, Validators.min(1)]],
      exam_questions:  [10,  [Validators.required, Validators.min(1), Validators.max(50)]],
      launch_date:     [null],
    });
  }

  closeApprovePanel(): void { this.approvePanel = null; }

  submitApprove(): void {
    if (!this.approvePanel || this.approveForm.invalid) return;

    this.isApproving  = true;
    this.errorMessage = '';

    this.reviewService.approveCourse(this.approvePanel.id, this.approveForm.value).subscribe({
      next: () => {
        const course = this.courses.find(c => c.id === this.approvePanel!.id);
        if (course) {
          course.status      = 'published';
          course.token_price = this.approveForm.value.token_price;
          course.launch_date = this.approveForm.value.launch_date;
        }
        this.isApproving  = false;
        this.approvePanel = null;
        this.successMessage = 'Curso aprobado y publicado exitosamente.';
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isApproving  = false;
        this.errorMessage = err.error?.message || 'Error al aprobar el curso.';
        this.cdr.detectChanges();
      }
    });
  }

  // ===== RECHAZAR =====
  openRejectPanel(course: ReviewCourse): void {
    this.rejectPanel   = course;
    this.approvePanel  = null;
    this.rejectReason  = '';
    this.errorMessage  = '';
  }

  closeRejectPanel(): void { this.rejectPanel = null; }

  submitReject(): void {
    if (!this.rejectPanel || !this.rejectReason.trim()) return;

    this.isRejecting  = true;
    this.errorMessage = '';

    this.reviewService.rejectCourse(this.rejectPanel.id, this.rejectReason).subscribe({
      next: () => {
        const course = this.courses.find(c => c.id === this.rejectPanel!.id);
        if (course) {
          course.status           = 'rejected';
          course.rejection_reason = this.rejectReason;
        }
        this.isRejecting  = false;
        this.rejectPanel  = null;
        this.successMessage = 'Curso rechazado. El instructor fue notificado.';
        setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isRejecting  = false;
        this.errorMessage = err.error?.message || 'Error al rechazar el curso.';
        this.cdr.detectChanges();
      }
    });
  }

  // ===== DESPUBLICAR =====
  unpublish(course: ReviewCourse): void {
    if (!confirm(`¿Despublicar "${course.title}"? Los estudiantes inscritos conservarán su acceso.`)) return;

    this.reviewService.unpublishCourse(course.id).subscribe({
      next: () => {
        course.status = 'unpublished';
        this.cdr.detectChanges();
      }
    });
  }

 previewCourse(id: number): void {
  this.router.navigate(['/admin/courses', id, 'preview']);
}


get inReviewCount(): number {
  return this.courses.filter(c => c.status === 'in_review').length;
}

get publishedCount(): number {
  return this.courses.filter(c => c.status === 'published').length;
}

get rejectedCount(): number {
  return this.courses.filter(c => c.status === 'rejected').length;
}
}