import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPassword = false;
  token = '';
  email = '';

  passwordPattern = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(this.passwordPattern),
          ],
        ],
        password_confirmation: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // El token y email vienen en la URL del correo
    this.token = this.route.snapshot.queryParams['token'] || '';
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  get password() {
    return this.resetForm.get('password');
  }
  get passwordConfirmation() {
    return this.resetForm.get('password_confirmation');
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('password_confirmation')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  getStrength(): number {
    const p = this.password;
    if (!p?.value) return 0;

    let score = 0;
    if (p.value.length >= 8) score++;
    if (/[A-Z]/.test(p.value)) score++;
    if (/[a-z]/.test(p.value)) score++;
    if (/\d/.test(p.value)) score++;
    if (/[\W_]/.test(p.value)) score++;

    // Map score to one of 4 levels for the bars
    if (score <= 2) return 1; // Débil
    else if (score === 3) return 2; // Regular
    else if (score === 4) return 3; // Buena
    else return 4; // Fuerte
  }

  getStrengthLabel(): string {
    const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    return labels[this.getStrength()];
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword({
      token: this.token,
      email: this.email,
      password: this.resetForm.value.password,
      password_confirmation: this.resetForm.value.password_confirmation,
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message;
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al restablecer la contraseña.';
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}