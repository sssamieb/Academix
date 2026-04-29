import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InstructorCourseService, Lesson, Section } from '../../../core/services/instructor-course.service';
import { SafePipe } from '../../../core/pipes/safe.pipe';

@Component({
  selector: 'app-lesson-preview',
  standalone: true,
  imports: [CommonModule, SafePipe],
  templateUrl: './lesson-preview.component.html',
  styleUrls: ['./lesson-preview.component.scss'],
})
export class LessonPreviewComponent implements OnInit {
  courseId!:  number;
  lessonId!:  number;
  isQuizMode  = false;
  isLoading   = true;

  course:   any       = null;
  sections: Section[] = [];
  lesson:   Lesson | null = null;
  section:  Section | null = null;

  // Quiz
  quizStarted   = false;
  quizSubmitted = false;
  timeLeft      = 0;
  totalTime     = 0;
  timerInterval: any;
  selectedAnswers: Record<number, number> = {};
  quizScore     = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: InstructorCourseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    this.courseId  = Number(params.get('id'));
    this.lessonId  = Number(params.get('lessonId'));
    this.isQuizMode = this.route.snapshot.url.some(s => s.path === 'quiz');
    this.isLoading  = true;
    this.quizStarted   = false;
    this.quizSubmitted = false;
    this.selectedAnswers = {};
    clearInterval(this.timerInterval);
    this.loadData();
  });

  // También detectar cambio de modo quiz (cuando cambia la URL completa)
  this.route.url.subscribe(url => {
    this.isQuizMode = url.some(s => s.path === 'quiz');
    this.cdr.detectChanges();
  });
}

  loadData(): void {
    this.courseService.getCoursePreview(this.courseId).subscribe({
      next: (res) => {
        this.course   = res.course;
        this.sections = (res.course as any).sections ?? [];

        for (const sec of this.sections) {
          const found = sec.lessons?.find((l: Lesson) => l.id === this.lessonId);
          if (found) {
            this.lesson  = found;
            this.section = sec;
            break;
          }
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ===== NAVEGACIÓN =====
  goBack(): void {
    this.router.navigate(['/instructor/courses', this.courseId, 'preview']);
  }

  goToLesson(lesson: Lesson, type: 'video' | 'article' | 'quiz'): void {
    if (type === 'quiz') {
      this.router.navigate(['/instructor/courses', this.courseId, 'preview', 'lessons', lesson.id, 'quiz']);
    } else {
      this.router.navigate(['/instructor/courses', this.courseId, 'preview', 'lessons', lesson.id]);
    }
  }

  getContentSections(): Section[] {
    return this.sections.filter(s => !s.is_presentation && !s.is_final_exam);
  }

  // ===== EMBED =====
  getEmbedUrl(url: string | null): string | null {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return url;
  }

  // ===== QUIZ =====
  get timerDisplay(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timerPercent(): number {
    return this.totalTime > 0 ? (this.timeLeft / this.totalTime) * 100 : 0;
  }

  get timerWarning(): boolean {
    return this.timeLeft <= 60;
  }

  startQuiz(): void {
    if (!this.lesson?.quiz) return;
    this.quizStarted    = true;
    this.quizSubmitted  = false;
    this.selectedAnswers = {};
    this.totalTime      = (this.lesson.quiz.time_limit_minutes ?? 5) * 60;
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

  selectAnswer(questionIndex: number, optionIndex: number): void {
    if (this.quizSubmitted) return;
    this.selectedAnswers[questionIndex] = optionIndex;
  }

  isSelected(questionIndex: number, optionIndex: number): boolean {
    return this.selectedAnswers[questionIndex] === optionIndex;
  }

  isCorrectOption(questionIndex: number, optionIndex: number): boolean {
    return this.lesson?.quiz?.questions[questionIndex]?.options[optionIndex]?.is_correct ?? false;
  }

  submitQuiz(): void {
    clearInterval(this.timerInterval);
    if (!this.lesson?.quiz) return;

    const questions = this.lesson.quiz.questions;
    let correct = 0;

    questions.forEach((q, qi) => {
      const selectedOi = this.selectedAnswers[qi];
      if (selectedOi !== undefined && q.options[selectedOi]?.is_correct) {
        correct++;
      }
    });

    this.quizScore    = Math.round((correct / questions.length) * 100);
    this.quizSubmitted = true;
    this.cdr.detectChanges();
  }

  get quizPassed(): boolean {
    return this.quizScore >= (this.lesson?.quiz?.passing_score ?? 70);
  }

  retryQuiz(): void {
    this.startQuiz();
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }
  get answeredCount(): number {
  return Object.keys(this.selectedAnswers).length;
}
}