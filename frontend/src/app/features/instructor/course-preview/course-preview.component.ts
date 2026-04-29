import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InstructorCourseService, Course, Section, Lesson } from '../../../core/services/instructor-course.service';
import { SafePipe } from '../../../core/pipes/safe.pipe';

@Component({
  selector: 'app-course-preview',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, SafePipe],
  templateUrl: './course-preview.component.html',
  styleUrls: ['./course-preview.component.scss'],
})
export class CoursePreviewComponent implements OnInit {
  course:   Course | null = null;
  sections: Section[]    = [];
  isLoading = true;
  courseId!: number;

  // Lección activa en el panel de contenido
  activeLesson:   Lesson | null  = null;
  activeSection:  Section | null = null;
  activeSectionIndex = 0;

  // Control de secciones expandidas en el índice
  expandedSections: Record<number, boolean> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: InstructorCourseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadPreview();
    }

    loadPreview(): void {
    this.courseService.getCoursePreview(this.courseId).subscribe({
        next: (res) => {
        this.course   = res.course;
        this.sections = (res.course as any).sections ?? [];
        this.isLoading = false;

        // Presentación expandida por defecto, secciones cerradas
        this.expandedSections[-1] = true;
        this.getContentSections().forEach((_, i) => {
            this.expandedSections[i] = i === 0; // solo la primera abierta
        });

        this.cdr.detectChanges();
        },
        error: () => { this.isLoading = false; }
    });
    }

  selectLesson(section: Section, lesson: Lesson): void {
    this.activeLesson  = lesson;
    this.activeSection = section;
    this.cdr.detectChanges();
  }

  toggleSection(index: number): void {
    this.expandedSections[index] = !this.expandedSections[index];
  }

  isLessonActive(lesson: Lesson): boolean {
    return this.activeLesson?.id === lesson.id;
  }

  getTotalLessons(): number {
    return this.sections
      .filter(s => !s.is_presentation && s.title !== 'Examen final')
      .reduce((acc, s) => acc + (s.lessons?.length ?? 0), 0);
  }

  getContentSections(): Section[] {
    return this.sections.filter(s => !s.is_presentation && s.title !== 'Examen final');
  }

  getPresentationSection(): Section | null {
    return this.sections.find(s => s.is_presentation) ?? null;
  }

  goBack(): void {
    this.router.navigate(['/instructor/courses', this.courseId, 'edit']);
  }
  get shortDescription(): string {
  return (this.course as any)?.short_description ?? '';
}
getEmbedUrl(url: string | null): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

  // Si ya es una URL de embed u otro servicio, devolverla tal cual
  return url;
}

getTotalDuration(): string {
  const totalMinutes = this.sections
    .filter(s => !s.is_presentation && s.title !== 'Examen final')
    .flatMap(s => s.lessons)
    .reduce((acc, l) => acc + (l.duration ?? 0), 0);

  if (totalMinutes === 0) return '';
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}
navigateToLesson(lesson: Lesson, type: 'video' | 'article' | 'quiz'): void {
  if (type === 'quiz') {
    this.router.navigate(['/instructor/courses', this.courseId, 'preview', 'lessons', lesson.id, 'quiz']);
  } else {
    this.router.navigate(['/instructor/courses', this.courseId, 'preview', 'lessons', lesson.id]);
  }
}
}