import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CourseService, PublicCourse } from '../../../core/services/course.service';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, FormsModule],
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  courses:    PublicCourse[] = [];
  categories: any[]          = [];
  isLoading   = true;

  searchQuery      = '';
  selectedCategory = 0;
  selectedLevel    = '';

  private searchTimeout: any;

  constructor(
    private courseService: CourseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadCourses();
  }

  loadCategories(): void {
    this.courseService.getCategories().subscribe({
      next: (res) => { this.categories = res.categories; }
    });
  }

  loadCourses(): void {
    this.isLoading = true;
    const filters: any = {};
    if (this.selectedCategory) filters.category_id = this.selectedCategory;
    if (this.selectedLevel)    filters.level        = this.selectedLevel;
    if (this.searchQuery)      filters.search       = this.searchQuery;

    this.courseService.getCourses(filters).subscribe({
      next: (res) => {
        this.courses   = res.courses;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadCourses(), 400);
  }

  setCategory(id: number): void {
    this.selectedCategory = id;
    this.loadCourses();
  }

  setLevel(level: string): void {
    this.selectedLevel = level;
    this.loadCourses();
  }

  clearFilters(): void {
    this.searchQuery      = '';
    this.selectedCategory = 0;
    this.selectedLevel    = '';
    this.loadCourses();
  }

  get hasFilters(): boolean {
    return !!(this.searchQuery || this.selectedCategory || this.selectedLevel);
  }

  goToCourse(id: number): void {
    this.router.navigate(['/student/courses', id]);
  }

  getCategoryColor(categoryName: string | undefined): string {
  const colors: Record<string, string> = {
    'Desarrollo Web':         '#4F46E5',
    'Apps Móviles':           '#8B5CF6',
    'Inteligencia Artificial':'#06B6D4',
    'Diseño UX/UI':           '#EC4899',
    'Data Science':           '#F59E0B',
    'Ciberseguridad':         '#EF4444',
    'DevOps':                 '#10B981',
    'Base de datos':          '#F97316',
    'Programación':           '#3B82F6',
  };
  return colors[categoryName ?? ''] ?? '#64748B';
}

  getLevelLabel(level: string): string {
    const map: Record<string, string> = {
      basico:      'Básico',
      intermedio:  'Intermedio',
      avanzado:    'Avanzado',
    };
    return map[level] ?? level;
  }
}