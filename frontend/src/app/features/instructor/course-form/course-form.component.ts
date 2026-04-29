import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InstructorCourseService, CourseCategory } from '../../../core/services/instructor-course.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
})
export class CourseFormComponent implements OnInit {
  courseForm!: FormGroup;
  categories:   CourseCategory[] = [];
  isLoading     = false;
  isSaving      = false;
  errorMessage  = '';

  constructor(
    private fb: FormBuilder,
    private courseService: InstructorCourseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCategories();
  }

  buildForm(): void {
    this.courseForm = this.fb.group({
      title:             ['', [Validators.required, Validators.minLength(10)]],
      short_description: ['', [Validators.required, Validators.maxLength(500)]],
      category_id:       [null, Validators.required],
      level:             ['',   Validators.required],
    });
  }

  loadCategories(): void {
    this.isLoading = true;
    this.courseService.getCategories().subscribe({
      next:  (res) => { this.categories = res.categories; this.isLoading = false; },
      error: ()    => { this.isLoading = false; },
    });
  }

  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    this.isSaving     = true;
    this.errorMessage = '';

    this.courseService.createCourse(this.courseForm.value).subscribe({
      next: (res) => {
        this.isSaving = false;
        // Redirige al editor del curso recién creado
        this.router.navigate(['/instructor/courses', res.course.id, 'edit']);
      },
      error: (err) => {
        this.isSaving     = false;
        this.errorMessage = err.error?.message || 'Error al crear el curso.';
      },
    });
  }

  cancel(): void { this.router.navigate(['/instructor/courses']); }

  get title()             { return this.courseForm.get('title'); }
  get short_description() { return this.courseForm.get('short_description'); }
  get category_id()       { return this.courseForm.get('category_id'); }
  get level()             { return this.courseForm.get('level'); }
}