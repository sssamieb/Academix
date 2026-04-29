import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent implements OnInit {
  email = '';
  isResending = false;
  resendMessage = '';
  resendError = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParams['email'] || '';
  }

  resendEmail(): void {
    if (!this.email) return;

    this.isResending = true;
    this.resendMessage = '';
    this.resendError = '';

    this.authService.resendVerification(this.email).subscribe({
      next: (res) => {
        this.isResending = false;
        this.resendMessage = res.message;
      },
      error: (err) => {
        this.isResending = false;
        this.resendError = err.error?.message || 'Error al reenviar.';
      },
    });
  }
}