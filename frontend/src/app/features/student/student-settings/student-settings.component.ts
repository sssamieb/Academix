import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PaymentService } from '../../../core/services/payment.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-student-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './student-settings.component.html',
  styleUrls: ['./student-settings.component.scss'],
})
export class StudentSettingsComponent implements OnInit {
  activeTab = 'security';

  // Contraseña
  passwordForm!:      FormGroup;
  isChangingPassword  = false;
  showCurrentPassword = false;
  showNewPassword     = false;
  showConfirmPassword = false;

  // Pagos
  payments:         any[] = [];
  isLoadingPayments = false;

  // Usuario
  user: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private paymentService: PaymentService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Refrescar usuario para tener is_google_user actualizado
    this.authService.refreshUser().subscribe({
      next: (user) => {
        this.user = user;
        this.buildPasswordForm();
        this.cdr.detectChanges();
      },
      error: () => {
        this.user = this.authService.currentUser();
        this.buildPasswordForm();
      }
    });
  }

  get isGoogleUser(): boolean {
    return !!(this.user as any)?.is_google_user;
  }

  buildPasswordForm(): void {
    if (this.isGoogleUser) {
      // Usuario de Google — no pide contraseña actual
      this.passwordForm = this.fb.group({
        password:              ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', Validators.required],
      }, { validators: this.passwordMatchValidator });
    } else {
      // Usuario normal — pide contraseña actual
      this.passwordForm = this.fb.group({
        current_password:      ['', Validators.required],
        password:              ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', Validators.required],
      }, { validators: this.passwordMatchValidator });
    }
  }

  passwordMatchValidator(form: FormGroup): { mismatch: true } | null {
    const pw  = form.get('password')?.value;
    const cpw = form.get('password_confirmation')?.value;
    return pw && cpw && pw !== cpw ? { mismatch: true } : null;
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'payments' && this.payments.length === 0) {
      this.loadPayments();
    }
  }

  loadPayments(): void {
    this.isLoadingPayments = true;
    this.paymentService.getHistory().subscribe({
      next: (res) => {
        this.payments          = res.payments;
        this.isLoadingPayments = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingPayments = false; }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword = true;

    // Si es usuario de Google, mandamos current_password vacío
    const payload = this.isGoogleUser
      ? {
          current_password:      '',
          password:              this.passwordForm.value.password,
          password_confirmation: this.passwordForm.value.password_confirmation,
        }
      : this.passwordForm.value;

    this.authService.changePassword(payload).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordForm.reset();

        // Ya no es usuario de Google puro — tiene contraseña
        if (this.isGoogleUser) {
          (this.user as any).is_google_user = false;
          this.buildPasswordForm();
        }

        Swal.fire({
          title: '¡Contraseña actualizada!',
          text: 'Tu contraseña fue cambiada exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isChangingPassword = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo cambiar la contraseña.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
        this.cdr.detectChanges();
      }
    });
  }

  getPlanBadgeClass(planType: string): string {
    const map: Record<string, string> = {
      basic:   'badge-basic',
      pro:     'badge-pro',
      premium: 'badge-premium',
    };
    return map[planType] ?? 'badge-basic';
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-BO', {
      style:    'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }

  get currentCtrl() { return this.passwordForm.get('current_password'); }
  get newCtrl()     { return this.passwordForm.get('password'); }
  get confirmCtrl() { return this.passwordForm.get('password_confirmation'); }
  get hasMismatch() { return this.passwordForm.hasError('mismatch') && this.confirmCtrl?.touched; }
}