import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InstructorProfileService {
  private readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.API}/instructor/profile`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/instructor/profile`, data);
  }

  getPublicProfile(userId: number): Observable<any> {
    return this.http.get<any>(`${this.API}/instructors/${userId}/profile`);
  }
}