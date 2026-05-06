import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserManagementService } from '../../../core/services/admin-user-management.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-students.component.html',
  styleUrls: ['./admin-students.component.scss'],
})
export class AdminStudentsComponent implements OnInit {
  students:   any[] = [];
  isLoading   = true;
  searchQuery = '';
  private searchTimeout: any;

  constructor(
    private service: AdminUserManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadStudents(); }

  loadStudents(): void {
    this.isLoading = true;
    this.service.getStudents(this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.students  = res.students;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadStudents(), 400);
  }

  async toggleActive(student: any): Promise<void> {
    const action = student.is_active ? 'deshabilitar' : 'habilitar';
    const result = await Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${student.name}?`,
      text: student.is_active
        ? 'El estudiante no podrá acceder a la plataforma.'
        : 'El estudiante podrá acceder nuevamente.',
      icon: 'warning',
      showCancelButton:  true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText:  'Cancelar',
      confirmButtonColor: student.is_active ? '#EF4444' : '#10B981',
      cancelButtonColor:  '#64748B',
    });

    if (!result.isConfirmed) return;

    this.service.toggleActive(student.id).subscribe({
      next: (res) => {
        student.is_active = res.is_active;
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

  getPlanName(student: any): string {
    if (!student.plan) return 'Sin plan';
    return student.plan.name;
  }

  getPlanClass(student: any): string {
    if (!student.plan) return 'no-plan';
    return student.plan.type;
  }

  getInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  get activeCount(): number {
    return this.students.filter(s => s.is_active).length;
  }

  isPremium(user: any): boolean {
    return user?.plan?.type === 'premium';
  }
}