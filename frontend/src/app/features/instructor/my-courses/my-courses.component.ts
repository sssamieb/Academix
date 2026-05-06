import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { InstructorCourseService, Course } from '../../../core/services/instructor-course.service';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
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
  getCoursePattern(course: Course): SafeHtml {
  const id = course.id;
  const colors = [
    ['#4F46E5', '#7C3AED', '#2D2D7B'],
    ['#06B6D4', '#0891B2', '#164E63'],
    ['#10B981', '#059669', '#064E3B'],
    ['#F59E0B', '#D97706', '#78350F'],
    ['#EF4444', '#DC2626', '#7F1D1D'],
    ['#EC4899', '#DB2777', '#831843'],
    ['#8B5CF6', '#7C3AED', '#4C1D95'],
    ['#F97316', '#EA580C', '#7C2D12'],
  ];

  const palette = colors[id % colors.length];
  const c1 = palette[0];
  const c2 = palette[1];
  const c3 = palette[2];

  const patterns = [
    // Cuadrados y rectángulos
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none">
      <defs><linearGradient id="g${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient></defs>
      <rect width="300" height="160" fill="url(#g${id})"/>
      <rect x="20" y="20" width="60" height="60" fill="${c2}" opacity="0.3" rx="4"/>
      <rect x="100" y="10" width="40" height="40" fill="${c1}" opacity="0.4" rx="2"/>
      <rect x="160" y="30" width="80" height="80" fill="${c2}" opacity="0.2" rx="6"/>
      <rect x="250" y="10" width="30" height="30" fill="${c1}" opacity="0.5" rx="2"/>
      <rect x="40" y="90" width="50" height="50" fill="${c2}" opacity="0.25" rx="4"/>
      <rect x="110" y="70" width="30" height="70" fill="${c1}" opacity="0.3" rx="2"/>
      <rect x="220" y="100" width="60" height="40" fill="${c2}" opacity="0.35" rx="4"/>
    </svg>`,

    // Círculos
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none">
      <defs><linearGradient id="g${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient></defs>
      <rect width="300" height="160" fill="url(#g${id})"/>
      <circle cx="50"  cy="50"  r="40" fill="${c2}" opacity="0.25"/>
      <circle cx="150" cy="80"  r="60" fill="${c1}" opacity="0.2"/>
      <circle cx="250" cy="40"  r="35" fill="${c2}" opacity="0.3"/>
      <circle cx="100" cy="130" r="25" fill="${c1}" opacity="0.35"/>
      <circle cx="220" cy="120" r="45" fill="${c2}" opacity="0.2"/>
      <circle cx="280" cy="130" r="20" fill="${c1}" opacity="0.4"/>
    </svg>`,

    // Líneas diagonales
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none">
      <defs><linearGradient id="g${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient></defs>
      <rect width="300" height="160" fill="url(#g${id})"/>
      <line x1="0"   y1="0"   x2="160" y2="160" stroke="${c2}" stroke-width="20" opacity="0.2"/>
      <line x1="80"  y1="0"   x2="300" y2="220" stroke="${c2}" stroke-width="15" opacity="0.2"/>
      <line x1="160" y1="0"   x2="300" y2="140" stroke="${c1}" stroke-width="25" opacity="0.15"/>
      <line x1="0"   y1="80"  x2="220" y2="160" stroke="${c2}" stroke-width="10" opacity="0.25"/>
      <line x1="220" y1="0"   x2="300" y2="80"  stroke="${c1}" stroke-width="30" opacity="0.15"/>
    </svg>`,

    // Triángulos
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none">
      <defs><linearGradient id="g${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient></defs>
      <rect width="300" height="160" fill="url(#g${id})"/>
      <polygon points="0,0 100,0 0,100"       fill="${c2}" opacity="0.25"/>
      <polygon points="300,0 300,120 180,0"   fill="${c2}" opacity="0.2"/>
      <polygon points="100,160 220,160 160,60" fill="${c1}" opacity="0.25"/>
      <polygon points="0,160 80,160 0,100"    fill="${c1}" opacity="0.3"/>
      <polygon points="240,160 300,160 300,80" fill="${c2}" opacity="0.3"/>
      <polygon points="120,0 200,0 160,80"    fill="${c1}" opacity="0.2"/>
    </svg>`,

    // Hexágonos / rombos
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none">
      <defs><linearGradient id="g${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient></defs>
      <rect width="300" height="160" fill="url(#g${id})"/>
      <polygon points="60,10 90,40 60,70 30,40"   fill="${c2}" opacity="0.3"/>
      <polygon points="150,20 190,60 150,100 110,60" fill="${c1}" opacity="0.25"/>
      <polygon points="250,10 280,40 250,70 220,40" fill="${c2}" opacity="0.3"/>
      <polygon points="40,100 70,130 40,160 10,130"  fill="${c1}" opacity="0.25"/>
      <polygon points="200,90 240,120 200,150 160,120" fill="${c2}" opacity="0.2"/>
      <polygon points="120,80 150,110 120,140 90,110"  fill="${c1}" opacity="0.3"/>
    </svg>`,

    // Ondas
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 300 160" preserveAspectRatio="none">
      <defs><linearGradient id="g${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient></defs>
      <rect width="300" height="160" fill="url(#g${id})"/>
      <path d="M0,50 Q75,20 150,50 Q225,80 300,50 L300,160 L0,160 Z"
        fill="${c2}" opacity="0.2"/>
      <path d="M0,80 Q75,50 150,80 Q225,110 300,80 L300,160 L0,160 Z"
        fill="${c1}" opacity="0.2"/>
      <path d="M0,110 Q75,80 150,110 Q225,140 300,110 L300,160 L0,160 Z"
        fill="${c2}" opacity="0.25"/>
    </svg>`,
  ];

  const patternIndex = (id * 7 + Math.floor(id / 3)) % patterns.length;
  return this.sanitizer.bypassSecurityTrustHtml(patterns[patternIndex]);
}
  
}