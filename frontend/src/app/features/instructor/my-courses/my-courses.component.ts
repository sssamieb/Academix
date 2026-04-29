import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { InstructorCourseService, Course } from '../../../core/services/instructor-course.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.scss'],
})
export class MyCoursesComponent implements OnInit {
  courses:   Course[] = [];
  isLoading = true;
  filter    = 'all';

  statusLabels: Record<string, string> = {
    draft:       'Borrador',
    in_review:   'En revisión',
    rejected:    'Rechazado',
    published:   'Publicado',
    unpublished: 'Despublicado',
  };

  constructor(
    private courseService: InstructorCourseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseService.getCourses().subscribe({
      next: (res) => {
        this.courses   = res.courses;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filteredCourses(): Course[] {
    if (this.filter === 'all') return this.courses;
    return this.courses.filter(c => c.status === this.filter);
  }

  setFilter(f: string): void { this.filter = f; }
  goToCreate(): void         { this.router.navigate(['/instructor/courses/create']); }
  goToEdit(id: number): void { this.router.navigate(['/instructor/courses', id, 'edit']); }

  async submitForReview(course: Course): Promise<void> {
    const result = await Swal.fire({
      title: '¿Enviar a revisión?',
      text: 'No podrás editarlo hasta que el administrador lo revise.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#64748B',
    });

    if (!result.isConfirmed) return;

    this.courseService.submitForReview(course.id).subscribe({
      next: () => {
        course.status = 'in_review';
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

  async deleteCourse(course: Course): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar curso?',
      text: `"${course.title}" será eliminado permanentemente. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });

    if (!result.isConfirmed) return;

    this.courseService.deleteCourse(course.id).subscribe({
      next: () => {
        this.courses = this.courses.filter(c => c.id !== course.id);
        this.cdr.detectChanges();
        Swal.fire({
          title: 'Eliminado',
          text: 'El curso fue eliminado correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo eliminar el curso.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      draft:       'badge-draft',
      in_review:   'badge-review',
      rejected:    'badge-rejected',
      published:   'badge-published',
      unpublished: 'badge-unpublished',
    };
    return map[status] ?? '';
  }
}