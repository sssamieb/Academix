import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReviewCourse {
  id:               number;
  title:            string;
  short_description: string;
  level:            string;
  status:           string;
  token_price:      number | null;
  rejection_reason: string | null;
  submitted_at:     string | null;
  approved_at:      string | null;
  launch_date:      string | null;
  enrollments_count: number;
  instructor:       { id: number; name: string; email: string };
  category:         { id: number; name: string };
}

@Injectable({ providedIn: 'root' })
export class AdminCourseReviewService {
  private readonly API = 'http://localhost:8000/api/admin';

  constructor(private http: HttpClient) {}

  getCourses(): Observable<{ courses: ReviewCourse[] }> {
    return this.http.get<{ courses: ReviewCourse[] }>(`${this.API}/courses`);
  }

  getCourse(id: number): Observable<{ course: any }> {
    return this.http.get<{ course: any }>(`${this.API}/courses/${id}`);
  }

  approveCourse(id: number, data: { token_price: number; launch_date?: string; exam_questions?: number }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/courses/${id}/approve`, data);
  }

  rejectCourse(id: number, reason: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/courses/${id}/reject`, {
      rejection_reason: reason
    });
  }

  unpublishCourse(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/courses/${id}/unpublish`, {});
  }

  getCoursePreview(id: number): Observable<{ course: any }> {
  return this.http.get<{ course: any }>(`http://localhost:8000/api/admin/courses/${id}/preview`);
}
getLessonPreview(courseId: number, lessonId: number): Observable<{ lesson: any }> {
  return this.http.get<{ lesson: any }>(
    `http://localhost:8000/api/admin/courses/${courseId}/lessons/${lessonId}/preview`
  );
}
}