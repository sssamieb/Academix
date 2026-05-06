import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-instructor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './instructor-settings.component.html',
  styleUrls: ['./instructor-settings.component.scss'],
})
export class InstructorSettingsComponent implements OnInit {
  activeTab = 'security';

  // Contraseña
  passwordForm!:      FormGroup;
  isChangingPassword  = false;
  showCurrentPassword = false;
  showNewPassword     = false;
  showConfirmPassword = false;

  // Cuenta
  nameForm!:    FormGroup;
  isSavingName  = false;

  user: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.refreshUser().subscribe({
      next: (user) => {
        this.user = user;
        this.buildForms();
        this.cdr.detectChanges();
      },
      error: () => {
        this.user = this.authService.currentUser();
        this.buildForms();
      }
    });
  }

  get isGoogleUser(): boolean {
    return !!(this.user as any)?.is_google_user;
  }

  buildForms(): void {
    if (this.isGoogleUser) {
      this.passwordForm = this.fb.group({
        password:              ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', Validators.required],
      }, { validators: this.passwordMatchValidator });
    } else {
      this.passwordForm = this.fb.group({
        current_password:      ['', Validators.required],
        password:              ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', Validators.required],
      }, { validators: this.passwordMatchValidator });
    }

    this.nameForm = this.fb.group({
      name: [this.user?.name ?? '', [Validators.required, Validators.minLength(3)]],
    });
  }

  passwordMatchValidator(form: FormGroup): { mismatch: true } | null {
    const pw  = form.get('password')?.value;
    const cpw = form.get('password_confirmation')?.value;
    return pw && cpw && pw !== cpw ? { mismatch: true } : null;
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword = true;

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
        if (this.isGoogleUser) {
          (this.user as any).is_google_user = false;
          this.buildForms();
        }
        Swal.fire({
          title: '¡Contraseña actualizada!',
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

  saveName(): void {
    if (this.nameForm.invalid || this.isSavingName) return;
    this.isSavingName = true;

    this.http.post<any>('http://localhost:8000/api/auth/update-name', {
      name: this.nameForm.value.name
    }).subscribe({
      next: (res) => {
        this.isSavingName = false;
        this.user.name    = res.user.name;
        this.authService.refreshUser().subscribe();
        Swal.fire({
          title: '¡Nombre actualizado!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingName = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el nombre.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
        this.cdr.detectChanges();
      }
    });
  }

  get currentCtrl() { return this.passwordForm.get('current_password'); }
  get newCtrl()     { return this.passwordForm.get('password'); }
  get confirmCtrl() { return this.passwordForm.get('password_confirmation'); }
  get hasMismatch() { return this.passwordForm.hasError('mismatch') && this.confirmCtrl?.touched; }
  get nameCtrl()    { return this.nameForm.get('name'); }
}