import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email-confirm',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email-confirm.component.html',
  styleUrls: ['./verify-email-confirm.component.scss'],
})
export class VerifyEmailConfirmComponent implements OnInit, OnDestroy {
  status: 'loading' | 'success' | 'error' = 'loading';
  errorMessage = 'El enlace de verificación es inválido o ha expirado.';
  email = '';
  countdown = 5;

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParams;
    const id        = params['id'];
    const hash      = params['hash'];
    const expires   = params['expires'];
    const signature = params['signature'];

    if (!id || !hash || !expires || !signature) {
      this.status = 'error';
      this.errorMessage = 'El enlace de verificación es inválido o está incompleto.';
      return;
    }

    this.authService.confirmVerifyEmail({ id, hash, expires, signature }).subscribe({
      next: () => {
        this.status = 'success';
        this.startCountdown();
      },
      error: (err) => {
        this.status = 'error';
        this.errorMessage =
          err.error?.message || 'El enlace de verificación es inválido o ha expirado.';
        // Intentar recuperar el email del error para el botón de reenvío
        this.email = err.error?.email || '';
      },
    });
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.clearCountdown();
        this.router.navigate(['/auth/login']);
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
}