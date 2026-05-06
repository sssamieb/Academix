import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-exam',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-exam.component.html',
  styleUrls: ['./student-exam.component.scss'],
})
export class StudentExamComponent implements OnInit, OnDestroy {
  courseId!: number;
  isLoading = true;

  course:       any = null;
  quiz:         any = null;
  enrollment:   any = null;
  attemptsUsed  = 0;
  maxAttempts:  number | null = null;
  unlimited     = true;
  canAttempt    = true;
  bestAttempt:  any = null;

  // Estado del examen
  examStarted   = false;
  examSubmitted = false;
  timeLeft      = 0;
  totalTime     = 0;
  timerInterval: any;
  alreadyPassed = false;
  selectedAnswers: Record<number, number> = {};
  examResult:   any = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadExam();
  }

  loadExam(): void {
    this.courseService.getStudentExam(this.courseId).subscribe({
      next: (res) => {
        this.course       = res.course;
        this.quiz         = res.quiz;
        this.enrollment   = res.enrollment;
        this.attemptsUsed = res.attempts_used;
        this.maxAttempts  = res.max_attempts;
        this.unlimited    = res.unlimited;
        this.alreadyPassed = res.already_passed ?? false;
        this.canAttempt    = res.can_attempt;
        this.bestAttempt  = res.best_attempt;
        this.isLoading    = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 403) {
          this.router.navigate(['/student/my-courses', this.courseId]);
        }
      }
    });
  }

  get timerDisplay(): string {
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get timerPercent(): number {
    return this.totalTime > 0 ? (this.timeLeft / this.totalTime) * 100 : 0;
  }

  get timerWarning(): boolean { return this.timeLeft <= 120; }
  get answeredCount(): number { return Object.keys(this.selectedAnswers).length; }
  get examPassed(): boolean   { return this.examResult?.passed ?? false; }

  startExam(): void {
    this.examStarted     = true;
    this.examSubmitted   = false;
    this.examResult      = null;
    this.selectedAnswers = {};
    this.totalTime       = (this.quiz?.time_limit_minutes ?? 60) * 60;
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
        this.submitExam();
      }
    }, 1000);
  }

  selectAnswer(qi: number, oi: number): void {
    if (this.examSubmitted) return;
    this.selectedAnswers[qi] = oi;
  }

  isSelected(qi: number, oi: number): boolean {
    return this.selectedAnswers[qi] === oi;
  }

  async confirmSubmit(): Promise<void> {
    const unanswered = this.quiz.questions.length - this.answeredCount;
    if (unanswered > 0) {
      const result = await Swal.fire({
        title: '¿Entregar examen?',
        html: `Tenés <strong>${unanswered} pregunta${unanswered > 1 ? 's' : ''} sin responder</strong>.<br>
               ¿Querés entregar igual?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, entregar',
        cancelButtonText: 'Seguir respondiendo',
        confirmButtonColor: '#4F46E5',
        cancelButtonColor: '#64748B',
      });
      if (!result.isConfirmed) return;
    }
    this.submitExam();
  }

  submitExam(): void {
    clearInterval(this.timerInterval);
    if (!this.quiz) return;

    const answers = this.quiz.questions.map((q: any, qi: number) => ({
      question_id:         q.id,
      selected_option_id:  q.options[this.selectedAnswers[qi] ?? 0]?.id ?? q.options[0]?.id,
    }));

    this.courseService.submitQuiz(this.courseId, this.quiz.id, answers).subscribe({
      next: (res) => {
        this.examResult    = res;
        this.examSubmitted = true;
        this.attemptsUsed++;
        this.canAttempt    = this.unlimited || (this.maxAttempts !== null && this.attemptsUsed < this.maxAttempts);

        // Si aprobó, marcar enrollment como completado
        if (res.passed) {
          this.enrollment.status = 'completed';
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.examSubmitted = true;
        if (err.error?.max_attempts) {
          this.canAttempt = false;
        }
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/student/my-courses', this.courseId]);
  }

  ngOnDestroy(): void { clearInterval(this.timerInterval); }
}