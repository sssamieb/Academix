import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-instructor-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-students.component.html',
  styleUrls: ['./instructor-students.component.scss'],
})
export class InstructorStudentsComponent implements OnInit {
  courses:         any[] = [];
  isLoading        = true;
  selectedCourse:  any  = null;
  searchQuery      = '';
  private searchTimeout: any;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<any>('http://localhost:8000/api/instructor/students').subscribe({
      next: (res) => {
        this.courses  = res.courses;
        this.isLoading = false;
        if (this.courses.length > 0) {
          this.selectedCourse = this.courses[0];
        }
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  get filteredStudents(): any[] {
    if (!this.selectedCourse?.enrollments) return [];
    let students = this.selectedCourse.enrollments;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      students = students.filter((e: any) =>
        e.user?.name?.toLowerCase().includes(q) ||
        e.user?.email?.toLowerCase().includes(q)
      );
    }
    return students;
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.cdr.detectChanges(), 300);
  }

  getStatusLabel(status: string): string {
    return { trial: 'Prueba', active: 'Activo', completed: 'Completado', refunded: 'Reembolsado' }[status] ?? status;
  }

  getStatusClass(status: string): string {
    return { trial: 'status-trial', active: 'status-active', completed: 'status-completed', refunded: 'status-refunded' }[status] ?? '';
  }

  getInitials(name: string): string {
    return name?.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() ?? '?';
  }

  getTimeAgo(dateStr: string): string {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const mins  = Math.floor(diff / 60000);
    if (days > 0)  return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (mins > 0)  return `hace ${mins}min`;
    return 'ahora mismo';
  }

  isPremium(user: any): boolean {
    return user?.plan?.type === 'premium';
  }
}