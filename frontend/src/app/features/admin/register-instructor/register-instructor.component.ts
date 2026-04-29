import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register-instructor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-instructor.component.html',
  styleUrls: ['./register-instructor.component.scss'],
})
export class RegisterInstructorComponent {
  instructorForm: FormGroup;
  isLoading         = false;
  successMessage    = '';
  errorMessage      = '';
  temporaryPassword = '';

  private readonly API_URL = 'http://localhost:8000/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    this.instructorForm = this.fb.group({
      name:  ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get name()  { return this.instructorForm.get('name');  }
  get email() { return this.instructorForm.get('email'); }

  onSubmit(): void {
    if (this.instructorForm.invalid) {
      this.instructorForm.markAllAsTouched();
      return;
    }

    this.isLoading         = true;
    this.successMessage    = '';
    this.errorMessage      = '';
    this.temporaryPassword = '';

    this.http.post<any>(`${this.API_URL}/instructors`, this.instructorForm.value).subscribe({
      next: (res) => {
        this.isLoading         = false;
        this.successMessage    = res.message;
        this.temporaryPassword = res.temporary_password;
        this.instructorForm.reset();
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err.error?.message || 'Error al registrar instructor.';
      },
    });
  }

  logout(): void { this.authService.logout(); }
}