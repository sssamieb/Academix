import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent {
  changeForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.changeForm = this.fb.group(
      {
        current_password: ['', Validators.required],
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(this.passwordPattern)
        ]],
        password_confirmation: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  get currentPassword() { return this.changeForm.get('current_password'); }
  get password() { return this.changeForm.get('password'); }
  get passwordConfirmation() { return this.changeForm.get('password_confirmation'); }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('password_confirmation')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.changeForm.invalid) {
      this.changeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.changePassword(this.changeForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        // Redirigir según rol después de cambiar contraseña
        const role = this.authService.getUserRole();
        if (role === 'instructor') this.router.navigate(['/instructor/dashboard']);
        else this.router.navigate(['/student/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al cambiar la contraseña.';
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
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

  // Consideramos fuerza de 1 a 4 para la barra según criterios cumplidos (min 8 + 3 otros)
  if (score <= 2) return 1;             // Debil
  else if (score === 3) return 2;       // Regular
  else if (score === 4) return 3;       // Buena
  else return 4;                        // Fuerte
}

getStrengthLabel(): string {
  const labels = ['','Débil', 'Regular', 'Buena', 'Fuerte'];
  return labels[this.getStrength()];
}
}