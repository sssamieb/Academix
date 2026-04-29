import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminCourseReviewService } from '../../../core/services/admin-course-review.service';
import { SafePipe } from '../../../core/pipes/safe.pipe';
import { Section, Lesson } from '../../../core/services/instructor-course.service';

@Component({
  selector: 'app-admin-course-preview',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, SafePipe],
  templateUrl: './admin-course-preview.component.html',
  styleUrls: ['./admin-course-preview.component.scss'],
})
export class AdminCoursePreviewComponent implements OnInit {
  course:   any       = null;
  sections: Section[] = [];
  isLoading = true;
  courseId!: number;

  expandedSections: Record<number, boolean> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: AdminCourseReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPreview();
  }

  loadPreview(): void {
    this.reviewService.getCoursePreview(this.courseId).subscribe({
      next: (res) => {
        this.course   = res.course;
        this.sections = res.course.sections ?? [];
        this.isLoading = false;
        this.expandedSections[-1] = true;
        this.getContentSections().forEach((_, i) => {
          this.expandedSections[i] = i === 0;
        });
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  get shortDescription(): string { return this.course?.short_description ?? ''; }

  toggleSection(index: number): void {
    this.expandedSections[index] = !this.expandedSections[index];
  }

  getTotalLessons(): number {
    return this.getContentSections().reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0);
  }

  getContentSections(): Section[] {
    return this.sections.filter(s => !s.is_presentation && !s.is_final_exam);
  }

  getPresentationSection(): Section | null {
    return this.sections.find(s => s.is_presentation) ?? null;
  }

  getTotalDuration(): string {
    const total = this.getContentSections()
      .flatMap(s => s.lessons)
      .reduce((acc, l) => acc + ((l as any).duration ?? 0), 0);
    if (total === 0) return '';
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m} min`;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  getEmbedUrl(url: string | null): string | null {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return url;
  }

  goBack(): void { this.router.navigate(['/admin/courses']); }
  
  navigateToLesson(lesson: any, type: 'video' | 'article' | 'quiz'): void {
  if (type === 'quiz') {
    this.router.navigate(['/admin/courses', this.courseId, 'preview', 'lessons', lesson.id, 'quiz']);
  } else {
    this.router.navigate(['/admin/courses', this.courseId, 'preview', 'lessons', lesson.id]);
  }
}
}