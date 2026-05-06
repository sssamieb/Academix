import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import { SafePipe } from '../../../core/pipes/safe.pipe';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-lesson',
  standalone: true,
  imports: [CommonModule, SafePipe],
  templateUrl: './student-lesson.component.html',
  styleUrls: ['./student-lesson.component.scss'],
})
export class StudentLessonComponent implements OnInit, OnDestroy {
  courseId!:  number;
  lessonId!:  number;
  isQuizMode  = false;
  isLoading   = true;

  course:     any = null;
  lesson:     any = null;
  enrollment: any = null;
  progress:   any = null;

  // Quiz
  quizStarted    = false;
  quizSubmitted  = false;
  timeLeft       = 0;
  totalTime      = 0;
  timerInterval: any;
  selectedAnswers: Record<number, number> = {};
  quizResult: any = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private courseService: CourseService,
    private authService: AuthService,
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

    this.route.url.subscribe(url => {
      this.isQuizMode = url.some(s => s.path === 'quiz');
      this.cdr.detectChanges();
    });
  }

  loadData(): void {
    this.courseService.getStudentCourse(this.courseId).subscribe({
      next: (res) => {
        this.course     = res.course;
        this.enrollment = res.enrollment;
      }
    });

    this.courseService.getStudentLesson(this.courseId, this.lessonId).subscribe({
      next: (res) => {
        this.lesson    = res.lesson;
        this.progress  = res.progress;
        this.isLoading = false;

        // Marcar como vista automáticamente
        if (!this.isQuizMode) {
          this.markAsCompleted();
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 403) {
          this.router.navigate(['/student/courses', this.courseId]);
        }
      }
    });
  }

  markAsCompleted(): void {
    this.courseService.markLesson(this.courseId, this.lessonId).subscribe({
      next: (res) => {
        // Mostrar SweetAlert del trial si corresponde
        if (res.show_trial_prompt && this.enrollment?.status === 'trial') {
          this.showTrialPrompt();
        }
      }
    });
  }

  async showTrialPrompt(): Promise<void> {
    const result = await Swal.fire({
      title: '¿Querés continuar con el curso?',
      html: `Ya viste suficiente contenido para decidir.<br><br>
             <strong>¿Qué querés hacer?</strong>`,
      icon: 'question',
      showDenyButton:    true,
      showCancelButton:  false,
      confirmButtonText: '❤️ Me gusta, continúo',
      denyButtonText:    '↩️ No me gustó, quiero mi reembolso',
      confirmButtonColor: '#4F46E5',
      denyButtonColor:    '#EF4444',
      allowOutsideClick:  false,
    });

    if (result.isConfirmed) {
      this.courseService.confirmEnrollment(this.courseId).subscribe({
        next: () => {
          if (this.enrollment) this.enrollment.status = 'active';
          this.cdr.detectChanges();
        }
      });
    } else if (result.isDenied) {
      this.courseService.refund(this.courseId).subscribe({
        next: () => {
          this.authService.refreshUser().subscribe();
          Swal.fire({
            title: 'Reembolso exitoso',
            text: 'Tus tokens fueron devueltos a tu cuenta.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/student/explore']);
          });
        }
      });
    }
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

  get timerWarning(): boolean { return this.timeLeft <= 60; }

  get answeredCount(): number { return Object.keys(this.selectedAnswers).length; }

  startQuiz(): void {
    this.quizStarted     = true;
    this.quizSubmitted   = false;
    this.quizResult      = null;
    this.selectedAnswers = {};
    this.totalTime       = (this.lesson?.quiz?.time_limit_minutes ?? 5) * 60;
    this.timeLeft        = this.totalTime;
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

 submitQuiz(): void {
  clearInterval(this.timerInterval);
  if (!this.lesson?.quiz) return;

  const answers = this.lesson.quiz.questions.map((q: any, qi: number) => ({
    question_id:         q.id,
    selected_option_id:  q.options[this.selectedAnswers[qi] ?? 0]?.id ?? q.options[0]?.id,
  }));

  this.courseService.submitQuiz(this.courseId, this.lesson.quiz.id, answers).subscribe({
    next: (res) => {
      this.quizResult    = res;
      this.quizSubmitted = true;
      this.cdr.detectChanges();
    },
    error: (err) => {
      if (err.status === 422 && err.error?.max_attempts) {
        this.quizResult = {
          score:         0,
          passed:        false,
          correct:       0,
          total:         this.lesson.quiz.questions.length,
          passing_score: this.lesson.quiz.passing_score,
          no_attempts:   true,
          attempts_used: err.error.attempts_used,
          max_attempts:  err.error.max_attempts,
        };
      }
      this.quizSubmitted = true;
      this.cdr.detectChanges();
    }
  });
}

  get quizPassed(): boolean {
    return this.quizResult?.passed ?? false;
  }

  retryQuiz(): void { this.startQuiz(); }

  goBack(): void {
  this.router.navigate(['/student/my-courses', this.courseId]);
}

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }
}