import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminUserManagementService } from '../../../core/services/admin-user-management.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-instructors.component.html',
  styleUrls: ['./admin-instructors.component.scss'],
})
export class AdminInstructorsComponent implements OnInit {
  instructors: any[] = [];
  isLoading    = true;
  searchQuery  = '';
  private searchTimeout: any;

  // Modal promover
  showPromoteModal = false;
  promoteEmail     = '';
  foundUser: any   = null;
  isSearching      = false;
  isPromoting      = false;
  promoteError     = '';

  constructor(
    private service: AdminUserManagementService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadInstructors(); }

  loadInstructors(): void {
    this.isLoading = true;
    this.service.getInstructors(this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.instructors = res.instructors;
        this.isLoading   = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadInstructors(), 400);
  }

  async toggleActive(instructor: any): Promise<void> {
    const action = instructor.is_active ? 'deshabilitar' : 'habilitar';
    const result = await Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${instructor.name}?`,
      text: instructor.is_active
        ? 'El instructor no podrá acceder a la plataforma ni crear cursos.'
        : 'El instructor podrá acceder nuevamente a la plataforma.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: instructor.is_active ? '#EF4444' : '#10B981',
      cancelButtonColor: '#64748B',
    });

    if (!result.isConfirmed) return;

    this.service.toggleActive(instructor.id).subscribe({
      next: (res) => {
        instructor.is_active = res.is_active;
        this.cdr.detectChanges();
        Swal.fire({
          title: res.message,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  }

  openPromoteModal(): void {
    this.showPromoteModal = true;
    this.promoteEmail     = '';
    this.foundUser        = null;
    this.promoteError     = '';
  }

  closePromoteModal(): void { this.showPromoteModal = false; }

  searchUser(): void {
    if (!this.promoteEmail.trim()) return;
    this.isSearching  = true;
    this.foundUser    = null;
    this.promoteError = '';

    this.service.findByEmail(this.promoteEmail).subscribe({
      next: (res) => {
        this.foundUser   = res.user;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.promoteError = err.error?.message || 'No se encontró el usuario.';
        this.isSearching  = false;
        this.cdr.detectChanges();
      }
    });
  }

  async promoteUser(): Promise<void> {
    if (!this.foundUser) return;
    this.isPromoting = true;

    this.service.promoteToInstructor(this.promoteEmail).subscribe({
      next: (res) => {
        this.isPromoting     = false;
        this.showPromoteModal = false;
        this.loadInstructors();
        Swal.fire({
          title: '¡Instructor promovido!',
          text: `${this.foundUser.name} ahora es instructor. Se le notificó por email.`,
          icon: 'success',
          confirmButtonColor: '#4F46E5',
        });
      },
      error: (err) => {
        this.isPromoting  = false;
        this.promoteError = err.error?.message || 'Error al promover usuario.';
        this.cdr.detectChanges();
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}