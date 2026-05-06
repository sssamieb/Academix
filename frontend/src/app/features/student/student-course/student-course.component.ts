import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { AuthService } from '../../../core/services/auth.service';
import { ForumService } from '../../../core/services/forum.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-course',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-course.component.html',
  styleUrls: ['./student-course.component.scss'],
})
export class StudentCourseComponent implements OnInit {
  courseId!:  number;
  course:     any = null;
  enrollment: any = null;
  isLoading   = true;

  lessonProgress:   Record<number, boolean> = {};
  passedQuizzes:    number[]                = [];
  unlockedSections: Record<number, boolean> = {};
  totalLessons      = 0;
  completedLessons  = 0;
  trialThreshold    = 0;
  attemptsPerQuiz:  Record<number, number>  = {};
  maxQuizAttempts:  number | null           = null;
  unlimitedAttempts = true;
  finalExamUnlocked = false;
  examPassed        = false;
  expandedSections: Record<number, boolean> = {};

  // Foro
  forumPosts:     any[]   = [];
  forumLoading    = false;
  forumExpanded   = false;
  canPost         = false;
  isInstructor    = false;
  newPostContent  = '';
  isPosting       = false;
  replyContent:   Record<number, string>  = {};
  isReplying:     Record<number, boolean> = {};
  expandedPost:   number | null = null;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private forumService: ForumService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCourse();
  }

  loadCourse(): void {
    this.courseService.getStudentCourse(this.courseId).subscribe({
      next: (res) => {
        this.course            = res.course;
        this.enrollment        = res.enrollment;
        this.lessonProgress    = res.lesson_progress;
        this.passedQuizzes     = Array.isArray(res.passed_quizzes)
          ? res.passed_quizzes
          : Object.values(res.passed_quizzes ?? {});
        this.unlockedSections  = res.unlocked_sections;
        this.totalLessons      = res.total_lessons;
        this.completedLessons  = res.completed_lessons;
        this.trialThreshold    = res.trial_threshold;
        this.attemptsPerQuiz   = res.attempts_per_quiz;
        this.maxQuizAttempts   = res.max_quiz_attempts;
        this.unlimitedAttempts = res.unlimited_attempts;
        this.finalExamUnlocked = res.final_exam_unlocked ?? false;
        this.isLoading         = false;

        const finalExamSection = (this.course?.sections ?? []).find((s: any) => s.is_final_exam);
        if (finalExamSection?.lessons?.[0]?.quiz) {
          this.examPassed = this.passedQuizzes.includes(finalExamSection.lessons[0].quiz.id);
        }

        this.getContentSections().forEach((s: any, i: number) => {
          this.expandedSections[i] = i === 0;
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 403) {
          this.router.navigate(['/student/explore']);
        }
      }
    });
  }

  // ===== FORO =====
  loadForum(): void {
    if (this.forumLoading) return;
    this.forumLoading = true;
    this.forumService.getPosts(this.courseId).subscribe({
      next: (res) => {
        this.forumPosts  = res.posts;
        this.canPost     = res.can_post;
        this.isInstructor = res.is_instructor;
        this.forumLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.forumLoading = false; }
    });
  }

  toggleForum(): void {
    this.forumExpanded = !this.forumExpanded;
    if (this.forumExpanded && this.forumPosts.length === 0) {
      this.loadForum();
    }
  }

  togglePost(postId: number): void {
    this.expandedPost = this.expandedPost === postId ? null : postId;
  }

  submitPost(): void {
    if (!this.newPostContent.trim() || this.isPosting) return;
    this.isPosting = true;

    this.forumService.createPost(this.courseId, this.newPostContent).subscribe({
      next: (res) => {
        res.post.replies = [];
        this.forumPosts.unshift(res.post);
        this.newPostContent = '';
        this.isPosting      = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isPosting = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo publicar.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  submitReply(postId: number): void {
    const content = this.replyContent[postId]?.trim();
    if (!content || this.isReplying[postId]) return;
    this.isReplying[postId] = true;

    this.forumService.createReply(this.courseId, postId, content).subscribe({
      next: (res) => {
        const post = this.forumPosts.find(p => p.id === postId);
        if (post) {
          if (!post.replies) post.replies = [];
          post.replies.push(res.reply);
        }
        this.replyContent[postId]  = '';
        this.isReplying[postId]    = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isReplying[postId] = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo responder.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  async deletePost(postId: number): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar publicación?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });
    if (!result.isConfirmed) return;

    this.forumService.deletePost(this.courseId, postId).subscribe({
      next: () => {
        this.forumPosts = this.forumPosts.filter(p => p.id !== postId);
        this.cdr.detectChanges();
      }
    });
  }

  async deleteReply(postId: number, replyId: number): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar respuesta?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });
    if (!result.isConfirmed) return;

    this.forumService.deleteReply(this.courseId, postId, replyId).subscribe({
      next: () => {
        const post = this.forumPosts.find(p => p.id === postId);
        if (post) post.replies = post.replies.filter((r: any) => r.id !== replyId);
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';
  }

  getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days > 0)  return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (mins > 0)  return `hace ${mins}min`;
    return 'ahora mismo';
  }

  // ===== RESTO =====
  getContentSections(): any[] {
    return (this.course?.sections ?? [])
      .filter((s: any) => !s.is_presentation && !s.is_final_exam);
  }

  getPresentationSection(): any {
    return (this.course?.sections ?? []).find((s: any) => s.is_presentation);
  }

  isSectionUnlocked(sectionId: number): boolean {
    return this.unlockedSections[sectionId] ?? false;
  }

  isLessonCompleted(lessonId: number): boolean {
    return this.lessonProgress[lessonId] ?? false;
  }

  isQuizPassed(quizId: number): boolean {
    return this.passedQuizzes.includes(quizId);
  }

  canAttemptQuiz(quizId: number): boolean {
    if (this.isQuizPassed(quizId)) return false;
    return this.hasAttemptsLeft(quizId);
  }

  get progressPercent(): number {
    if (this.totalLessons === 0) return 0;
    return Math.round((this.completedLessons / this.totalLessons) * 100);
  }

  get isTrialEligible(): boolean {
    return this.enrollment?.status === 'trial';
  }

  toggleSection(i: number): void {
    this.expandedSections[i] = !this.expandedSections[i];
  }

  async openLesson(section: any, lesson: any): Promise<void> {
    if (!this.isSectionUnlocked(section.id)) return;

    if (
      this.isTrialEligible &&
      this.completedLessons >= this.trialThreshold &&
      !this.isLessonCompleted(lesson.id)
    ) {
      const result = await Swal.fire({
        title: '¿Querés continuar con el curso?',
        html: `Ya viste suficiente para decidir.<br><br>
               <strong>¿Qué querés hacer?</strong>`,
        icon: 'question',
        showDenyButton:    true,
        showCancelButton:  false,
        confirmButtonText: '<i class="bi bi-heart-fill"></i> Me gusta, continúo',
        denyButtonText:    '<i class="bi bi-arrow-counterclockwise"></i> No me gustó, quiero mi reembolso',
        confirmButtonColor: '#4F46E5',
        denyButtonColor:    '#EF4444',
        allowOutsideClick:  false,
      });

      if (result.isConfirmed) {
        this.courseService.confirmEnrollment(this.courseId).subscribe({
          next: () => {
            this.enrollment.status = 'active';
            this.navigateToLesson(lesson);
          }
        });
      } else if (result.isDenied) {
        this.courseService.refund(this.courseId).subscribe({
          next: () => {
            this.authService.refreshUser().subscribe();
            Swal.fire({
              title: 'Reembolso exitoso',
              text: `Se devolvieron ${this.course.token_price} tokens a tu cuenta.`,
              icon: 'success',
              timer: 2000,
              showConfirmButton: false,
            }).then(() => {
              this.router.navigate(['/student/explore']);
            });
          }
        });
      }
      return;
    }

    this.navigateToLesson(lesson);
  }

  navigateToLesson(lesson: any): void {
    this.router.navigate(['/student/my-courses', this.courseId, 'lessons', lesson.id]);
  }

  goToExam(): void {
    this.router.navigate(['/student/my-courses', this.courseId, 'exam']);
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }

  getTotalDuration(): string {
    const total = this.getContentSections()
      .flatMap((s: any) => s.lessons ?? [])
      .reduce((acc: number, l: any) => acc + (l.duration ?? 0), 0);
    if (total === 0) return '';
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return `${m} min`;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  getAttemptsLeft(quizId: number): number | null {
    if (this.unlimitedAttempts || this.maxQuizAttempts === null) return null;
    const used = this.attemptsPerQuiz[quizId] ?? 0;
    return Math.max(0, this.maxQuizAttempts - used);
  }

  hasAttemptsLeft(quizId: number): boolean {
    const left = this.getAttemptsLeft(quizId);
    return left === null || left > 0;
  }
}