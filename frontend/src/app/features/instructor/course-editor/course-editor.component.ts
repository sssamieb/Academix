import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import {
  InstructorCourseService, Course, Section, Lesson, QuizData, CourseCategory
} from '../../../core/services/instructor-course.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-course-editor',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, FormsModule, ReactiveFormsModule, QuillModule],
  templateUrl: './course-editor.component.html',
  styleUrls: ['./course-editor.component.scss'],
})
export class CourseEditorComponent implements OnInit {
  course:    Course | null = null;
  sections:  Section[]    = [];
  categories: CourseCategory[] = [];
  isLoading  = true;
  isSaving   = false;
  courseId!: number;

  

  // Panel de info básica
  showInfoPanel = false;
  infoForm!: FormGroup;

  // Edición inline de títulos
  editingTitles: Record<string, boolean> = {};
  titleValues:   Record<string, string>  = {};

  // Panel lateral de lección
  activeLessonPanel: { section: Section; lesson: Lesson } | null = null;
  lessonForm!: FormGroup;

  // Panel de quiz
  activeQuizPanel: { lesson: Lesson; quiz: QuizData } | null = null;
  quizForm!: FormGroup;

  // Presentación
  presentationContent = '';
  savingPresentation  = false;

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: InstructorCourseService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCourse();
    this.loadCategories();
  }

  loadCourse(): void {
    this.courseService.getCourse(this.courseId).subscribe({
      next: (res) => {
        this.course    = res.course;
        this.sections  = (res.course as any).sections ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: (res) => { this.categories = res.categories; }
    });
  }

  // ===== INFO BÁSICA =====
  toggleInfoPanel(): void {
    this.showInfoPanel = !this.showInfoPanel;
    if (this.showInfoPanel && this.course) {
      this.infoForm = this.fb.group({
        title:             [this.course.title,             [Validators.required, Validators.minLength(10)]],
        short_description: [(this.course as any).short_description ?? '', [Validators.required, Validators.maxLength(500)]],
        category_id:       [(this.course as any).category_id,       Validators.required],
        level:             [this.course.level,             Validators.required],
      });
    }
  }

  saveInfo(): void {
    if (!this.infoForm?.valid) return;
    this.isSaving = true;

    this.courseService.updateCourse(this.courseId, this.infoForm.value).subscribe({
      next: (res) => {
        if (this.course) {
          this.course.title    = res.course.title;
          this.course.level    = res.course.level;
          this.course.category = res.course.category;
          (this.course as any).short_description = (res.course as any).short_description;
          (this.course as any).category_id       = (res.course as any).category_id;
        }
        this.isSaving     = false;
        this.showInfoPanel = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; }
    });
  }

  // ===== EDICIÓN INLINE DE TÍTULOS =====
  startEditTitle(key: string, currentValue: string): void {
    this.editingTitles[key] = true;
    this.titleValues[key]   = currentValue;
  }

  saveTitle(key: string, type: 'section' | 'lesson', id: number, sectionId?: number): void {
    const newTitle = this.titleValues[key]?.trim();
    if (!newTitle) { this.cancelEditTitle(key); return; }

    this.editingTitles[key] = false;

    if (type === 'section') {
      this.courseService.updateSection(this.courseId, id, { title: newTitle }).subscribe({
        next: () => {
          const section = this.sections.find(s => s.id === id);
          if (section) section.title = newTitle;
          this.cdr.detectChanges();
        }
      });
    } else if (type === 'lesson' && sectionId) {
      this.courseService.updateLesson(this.courseId, sectionId, id, { title: newTitle }).subscribe({
        next: () => {
          const section = this.sections.find(s => s.id === sectionId);
          const lesson  = section?.lessons.find(l => l.id === id);
          if (lesson) lesson.title = newTitle;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelEditTitle(key: string): void {
    this.editingTitles[key] = false;
  }

  onTitleKeydown(event: KeyboardEvent, key: string, type: 'section' | 'lesson', id: number, sectionId?: number): void {
    if (event.key === 'Enter')  this.saveTitle(key, type, id, sectionId);
    if (event.key === 'Escape') this.cancelEditTitle(key);
  }

  // ===== SECCIONES =====
  addSection(): void {
    this.courseService.addSection(this.courseId, 'Nueva sección').subscribe({
      next: (res) => {
        this.sections.splice(this.sections.length - 1, 0, res.section);
        this.cdr.detectChanges();
      }
    });
  }

  async deleteSection(section: Section): Promise<void> {
  const result = await Swal.fire({
    title: '¿Eliminar sección?',
    text: `Se eliminarán todas las lecciones de "${section.title}". Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
  });

  if (!result.isConfirmed) return;

  this.courseService.deleteSection(this.courseId, section.id).subscribe({
    next: () => {
      this.sections = this.sections.filter(s => s.id !== section.id);
      this.cdr.detectChanges();
      Swal.fire({
        title: 'Eliminada',
        text: 'La sección fue eliminada.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    },
    error: (err) => {
      Swal.fire({
        title: 'Error',
        text: err.error?.message || 'No se pudo eliminar la sección.',
        icon: 'error',
        confirmButtonColor: '#4F46E5',
      });
    }
  });
}

  // ===== LECCIONES =====
  addLesson(section: Section): void {
    this.courseService.addLesson(this.courseId, section.id, 'Nueva lección').subscribe({
      next: (res) => {
        section.lessons.push(res.lesson);
        this.cdr.detectChanges();
      }
    });
  }

  async deleteLesson(section: Section, lesson: Lesson): Promise<void> {
  const result = await Swal.fire({
    title: '¿Eliminar lección?',
    text: `"${lesson.title}" será eliminada permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#64748B',
  });

  if (!result.isConfirmed) return;

  this.courseService.deleteLesson(this.courseId, section.id, lesson.id).subscribe({
    next: () => {
      section.lessons = section.lessons.filter(l => l.id !== lesson.id);
      this.cdr.detectChanges();
    },
    error: (err) => {
      Swal.fire({
        title: 'Error',
        text: err.error?.message || 'No se pudo eliminar la lección.',
        icon: 'error',
        confirmButtonColor: '#4F46E5',
      });
    }
  });
}

  // ===== PANEL DE LECCIÓN =====
  openLessonPanel(section: Section, lesson: Lesson): void {
    this.activeLessonPanel = { section, lesson };
    this.lessonForm = this.fb.group({
      type:            [lesson.type            ?? null],
      video_url:       [lesson.video_url       ?? ''],
      article_content: [lesson.article_content ?? ''],
      notes:           [lesson.notes           ?? ''],
      duration:        [lesson.duration        ?? null],
    });
    this.activeQuizPanel = null;
  }

  closeLessonPanel(): void { this.activeLessonPanel = null; }

  saveLessonContent(): void {
    if (!this.activeLessonPanel) return;
    const { section, lesson } = this.activeLessonPanel;

    this.isSaving = true;
    this.courseService.updateLesson(this.courseId, section.id, lesson.id, this.lessonForm.value).subscribe({
      next: (res) => {
        lesson.video_url       = res.lesson.video_url;
        lesson.article_content = res.lesson.article_content;
        lesson.notes           = res.lesson.notes;
        lesson.duration        = res.lesson.duration;
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; }
    });
  }

  // ===== PANEL DE QUIZ =====
  openQuizPanel(lesson: Lesson): void {
    if (!lesson.quiz) return;
    this.activeQuizPanel   = { lesson, quiz: lesson.quiz };
    this.activeLessonPanel = null;
    this.buildQuizForm(lesson.quiz);
  }

  closeQuizPanel(): void { this.activeQuizPanel = null; }

  buildQuizForm(quiz: QuizData): void {
    this.quizForm = this.fb.group({
      passing_score:      [quiz.passing_score,      [Validators.required, Validators.min(1), Validators.max(100)]],
      time_limit_minutes: [quiz.time_limit_minutes, [Validators.required, Validators.min(1), Validators.max(180)]],
      questions: this.fb.array(
        quiz.questions.map(q => this.fb.group({
          question: [q.question, Validators.required],
          options:  this.fb.array(
            q.options.map(o => this.fb.group({
              option_text: [o.option_text, Validators.required],
              is_correct:  [o.is_correct],
            }))
          ),
        }))
      ),
    });
  }

  get quizQuestions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptions(questionIndex: number): FormArray {
    return this.quizQuestions.at(questionIndex).get('options') as FormArray;
  }

  addQuestion(): void {
    this.quizQuestions.push(this.fb.group({
      question: ['', Validators.required],
      options:  this.fb.array([
        this.fb.group({ option_text: ['', Validators.required], is_correct: [false] }),
        this.fb.group({ option_text: ['', Validators.required], is_correct: [false] }),
        this.fb.group({ option_text: ['', Validators.required], is_correct: [true]  }),
        this.fb.group({ option_text: ['', Validators.required], is_correct: [false] }),
      ]),
    }));
  }

  removeQuestion(index: number): void {
    if (this.quizQuestions.length > 1) this.quizQuestions.removeAt(index);
  }

  setCorrect(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    options.controls.forEach((opt, i) => opt.get('is_correct')?.setValue(i === optionIndex));
  }
  goToPreview(): void {
  this.router.navigate(['/instructor/courses', this.courseId, 'preview']);
}

  saveQuiz(): void {
    if (!this.activeQuizPanel || this.quizForm.invalid) return;

    this.isSaving = true;
    const { quiz } = this.activeQuizPanel;

    this.courseService.updateQuiz(this.courseId, quiz.id, this.quizForm.value).subscribe({
      next: (res) => {
        this.activeQuizPanel!.lesson.quiz = res.quiz;
        this.isSaving = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isSaving = false; }
    });
  }
  toggleQuiz(lesson: Lesson): void {
  if (!lesson.quiz) return;
  const newState = !lesson.quiz.is_active;

  this.courseService.toggleQuiz(this.courseId, lesson.quiz.id, newState).subscribe({
    next: () => {
      lesson.quiz!.is_active = newState;
      this.cdr.detectChanges();
    }
  });
}

  // ===== PRESENTACIÓN =====
  initPresentation(section: Section): void {
    this.presentationContent = section.presentation_content ?? '';
  }

  savePresentation(section: Section): void {
    this.savingPresentation = true;
    this.courseService.updateSection(this.courseId, section.id, {
      presentation_content: this.presentationContent
    }).subscribe({
      next: () => {
        section.presentation_content = this.presentationContent;
        this.savingPresentation = false;
        this.cdr.detectChanges();
      },
      error: () => { this.savingPresentation = false; }
    });
  }

  // ===== NAVEGACIÓN =====
  goBack(): void { this.router.navigate(['/instructor/courses']); }

  async submitForReview(): Promise<void> {
  const result = await Swal.fire({
    title: '¿Enviar a revisión?',
    text: 'No podrás editar el curso hasta que el administrador lo revise.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, enviar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#4F46E5',
    cancelButtonColor: '#64748B',
  });

  if (!result.isConfirmed) return;

  this.courseService.submitForReview(this.courseId).subscribe({
    next: () => {
      if (this.course) this.course.status = 'in_review';
      this.cdr.detectChanges();
      Swal.fire({
        title: '¡Enviado!',
        text: 'El curso fue enviado a revisión exitosamente.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
    },
    error: (err) => {
      Swal.fire({
        title: 'Error',
        text: err.error?.message || 'No se pudo enviar a revisión.',
        icon: 'error',
        confirmButtonColor: '#4F46E5',
      });
    }
  });
}

  isDraft(): boolean { 
    return this.course?.status === 'draft' || this.course?.status === 'rejected'; 
  }

  toggleContentType(type: 'video' | 'article'): void {
  const current = this.lessonForm.get('type')?.value;
  // Si ya está seleccionado ese tipo, deseleccionar
  if (current === type) {
    this.lessonForm.get('type')?.setValue(null);
  } else {
    // Seleccionar el nuevo tipo (reemplaza al anterior)
    this.lessonForm.get('type')?.setValue(type);
  }
}
}