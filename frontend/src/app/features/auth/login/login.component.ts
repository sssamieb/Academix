import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  googleLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

    onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;

        // Si debe cambiar contraseña (instructor primera vez)
        if (res.must_change_password) {
          this.router.navigate(['/auth/change-password']);
          return;
        }

        // Redirigir según rol
        const role = res.user.role;
        if (role === 'admin') this.router.navigate(['/admin/dashboard']);
        else if (role === 'instructor') this.router.navigate(['/instructor/dashboard']);
        else this.router.navigate(['/student/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        // Mensaje especial si no verificó email
        if (err.error?.email_verified === false) {
          this.router.navigate(['/auth/verify-email'], {
            queryParams: { email: this.loginForm.value.email }
          });
          return;
        }
        this.errorMessage = err.error?.message || 'Error al iniciar sesión.';
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }




loginWithGoogle(): void {
  this.googleLoading = true;
  this.errorMessage  = '';
  this.authService.loginWithGoogle();

  // Escucha si hay error para mostrar en el formulario
  const listener = (event: MessageEvent) => {
    if (event.origin !== 'http://localhost:4200') return;

    if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
      this.googleLoading = false;
      this.errorMessage  = event.data.error || 'Error al iniciar sesión con Google.';
      window.removeEventListener('message', listener);
    }

    if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
      this.googleLoading = false;
      window.removeEventListener('message', listener);
    }
  };

  window.addEventListener('message', listener);
}
}