import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminCourseReviewService } from '../../../core/services/admin-course-review.service';
import { SafePipe } from '../../../core/pipes/safe.pipe';
import { Section, Lesson } from '../../../core/services/instructor-course.service';

@Component({
  selector: 'app-admin-lesson-preview',
  standalone: true,
  imports: [CommonModule, SafePipe],
  templateUrl: './admin-lesson-preview.component.html',
  styleUrls: ['./admin-lesson-preview.component.scss'],
})
export class AdminLessonPreviewComponent implements OnInit {
  courseId!:  number;
  lessonId!:  number;
  isQuizMode  = false;
  isLoading   = true;

  course:   any       = null;
  sections: Section[] = [];
  lesson:   any       = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: AdminCourseReviewService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId  = Number(params.get('id'));
      this.lessonId  = Number(params.get('lessonId'));
      this.isQuizMode = this.route.snapshot.url.some(s => s.path === 'quiz');
      this.isLoading  = true;
      this.loadData();
    });

    this.route.url.subscribe(url => {
      this.isQuizMode = url.some(s => s.path === 'quiz');
      this.cdr.detectChanges();
    });
  }

  loadData(): void {
    // Cargar curso completo para el sidebar
    this.reviewService.getCoursePreview(this.courseId).subscribe({
      next: (res) => {
        this.course   = res.course;
        this.sections = res.course.sections ?? [];
        this.cdr.detectChanges();
      }
    });

    // Cargar lección específica
    this.reviewService.getLessonPreview(this.courseId, this.lessonId).subscribe({
      next: (res) => {
        this.lesson    = res.lesson;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  getContentSections(): Section[] {
    return this.sections.filter(s => !s.is_presentation && !s.is_final_exam);
  }

  getEmbedUrl(url: string | null): string | null {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return url;
  }

  goToLesson(lesson: Lesson, type: 'video' | 'article' | 'quiz'): void {
    if (type === 'quiz') {
      this.router.navigate(['/admin/courses', this.courseId, 'preview', 'lessons', lesson.id, 'quiz']);
    } else {
      this.router.navigate(['/admin/courses', this.courseId, 'preview', 'lessons', lesson.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/courses', this.courseId, 'preview']);
  }

  // ===== QUIZ =====
  quizStarted    = false;
  quizSubmitted  = false;
  timeLeft       = 0;
  totalTime      = 0;
  timerInterval: any;
  selectedAnswers: Record<number, number> = {};
  quizScore      = 0;

  get timerDisplay(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timerPercent(): number {
    return this.totalTime > 0 ? (this.timeLeft / this.totalTime) * 100 : 0;
  }

  get timerWarning(): boolean { return this.timeLeft <= 60; }

  get answeredCount(): number { return Object.keys(this.selectedAnswers).length; }

  get quizPassed(): boolean {
    return this.quizScore >= (this.lesson?.quiz?.passing_score ?? 70);
  }

  startQuiz(): void {
    this.quizStarted    = true;
    this.quizSubmitted  = false;
    this.selectedAnswers = {};
    this.totalTime      = (this.lesson?.quiz?.time_limit_minutes ?? 5) * 60;
    this.timeLeft       = this.totalTime;
    this.startTimer();
    this.cdr.detectChanges();
  }

  startTimer(): void {
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.cdr.detectChanges();
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.submitQuiz();
      }
    }, 1000);
  }

  selectAnswer(qi: number, oi: number): void {
    if (this.quizSubmitted) return;
    this.selectedAnswers[qi] = oi;
  }

  isSelected(qi: number, oi: number): boolean {
    return this.selectedAnswers[qi] === oi;
  }

  isCorrectOption(qi: number, oi: number): boolean {
    return this.lesson?.quiz?.questions[qi]?.options[oi]?.is_correct ?? false;
  }

  submitQuiz(): void {
    clearInterval(this.timerInterval);
    const questions = this.lesson?.quiz?.questions ?? [];
    let correct = 0;
    questions.forEach((q: any, qi: number) => {
      const oi = this.selectedAnswers[qi];
      if (oi !== undefined && q.options[oi]?.is_correct) correct++;
    });
    this.quizScore    = Math.round((correct / questions.length) * 100);
    this.quizSubmitted = true;
    this.cdr.detectChanges();
  }

  retryQuiz(): void { this.startQuiz(); }

  ngOnDestroy(): void { clearInterval(this.timerInterval); }
}