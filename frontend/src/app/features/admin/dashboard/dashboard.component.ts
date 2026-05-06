import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  today     = new Date();
  isLoading = true;

  stats = {
    students:    0,
    instructors: 0,
    courses:     0,
    revenue:     '0.00',
  };

  recentActivity: any[] = [];
  recentUsers:    any[] = [];

  constructor(
    private http: HttpClient,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<any>('http://localhost:8000/api/admin/dashboard/stats').subscribe({
      next: (res) => {
        this.stats          = res.stats;
        this.recentUsers    = res.recent_users;
        this.recentActivity = res.recent_activity;
        this.isLoading      = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  goToRegisterInstructor(): void { this.router.navigate(['/admin/register-instructor']); }
  goToCourses(): void            { this.router.navigate(['/admin/courses']); }
  goToReports(): void { this.router.navigate(['/admin/reports']); }
}