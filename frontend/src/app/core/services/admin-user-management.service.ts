import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminUserManagementService {
  private readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getInstructors(search?: string): Observable<{ instructors: any[] }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<{ instructors: any[] }>(`${this.API}/admin/instructors`, { params });
  }

  getStudents(search?: string): Observable<{ students: any[] }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<{ students: any[] }>(`${this.API}/admin/students`, { params });
  }

  toggleActive(userId: number): Observable<{ message: string; is_active: boolean }> {
    return this.http.post<{ message: string; is_active: boolean }>(
      `${this.API}/admin/users/${userId}/toggle-active`, {}
    );
  }

  findByEmail(email: string): Observable<{ user: any }> {
    const params = new HttpParams().set('email', email);
    return this.http.get<{ user: any }>(`${this.API}/admin/users/find-by-email`, { params });
  }

  promoteToInstructor(email: string): Observable<{ message: string; user: any }> {
    return this.http.post<{ message: string; user: any }>(
      `${this.API}/admin/users/promote-instructor`, { email }
    );
  }
}