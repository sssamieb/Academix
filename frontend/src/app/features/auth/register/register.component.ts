import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { strongPasswordValidator } from '../../../core/validators/password.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading     = false;
  errorMessage  = '';
  showPassword  = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        name:                 ['', [Validators.required, Validators.minLength(3)]],
        email:                ['', [Validators.required, Validators.email]],
        password:             ['', [Validators.required, strongPasswordValidator]],
        password_confirmation: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  get name()                 { return this.registerForm.get('name'); }
  get email()                { return this.registerForm.get('email'); }
  get password()             { return this.registerForm.get('password'); }
  get passwordConfirmation() { return this.registerForm.get('password_confirmation'); }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm  = form.get('password_confirmation')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading   = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/auth/verify-email'], {
          queryParams: { email: this.registerForm.value.email }
        });
      },
      error: (err) => {
        this.isLoading    = false;
        this.errorMessage = err.error?.message || 'Error al registrarse.';
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }
  getStrength(): number {
  const p = this.password;
  if (!p?.value) return 0;

  let score = 0;
  if (p.value.length >= 8)                                          score++;
  if (!p.errors?.['upperCase'] && !p.errors?.['lowerCase'])        score++;
  if (!p.errors?.['number'])                                        score++;
  if (!p.errors?.['symbol'])                                        score++;

  return score;
}

getStrengthLabel(): string {
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  return labels[this.getStrength()];
}
}