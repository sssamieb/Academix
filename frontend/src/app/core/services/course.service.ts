import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PublicCourse {
  id:                number;
  title:             string;
  short_description: string;
  slug:              string;
  level:             string;
  token_price:       number;
  enrollments_count: number;
  thumbnail:         string | null;
  launch_date:       string | null;
  category:          { id: number; name: string; icon: string };
  instructor:        { id: number; name: string };
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getCourses(filters?: {
    category_id?: number;
    level?: string;
    search?: string;
  }): Observable<{ courses: PublicCourse[] }> {
    let params: any = {};
    if (filters?.category_id) params.category_id = filters.category_id;
    if (filters?.level)       params.level        = filters.level;
    if (filters?.search)      params.search       = filters.search;
    return this.http.get<{ courses: PublicCourse[] }>(`${this.API}/courses`, { params });
  }

  getCourse(id: number): Observable<{ course: any }> {
    return this.http.get<{ course: any }>(`${this.API}/courses/${id}`);
  }

  getCategories(): Observable<{ categories: any[] }> {
    return this.http.get<{ categories: any[] }>(`${this.API}/course-categories`);
  }

  enroll(courseId: number): Observable<{ message: string; tokens_remaining: number }> {
  return this.http.post<{ message: string; tokens_remaining: number }>(
    `${this.API}/courses/${courseId}/enroll`, {}
  );
}

refund(courseId: number): Observable<{ message: string; tokens_remaining: number }> {
  return this.http.post<{ message: string; tokens_remaining: number }>(
    `${this.API}/courses/${courseId}/refund`, {}
  );
}

confirmEnrollment(courseId: number): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(
    `${this.API}/courses/${courseId}/confirm-enrollment`, {}
  );
}

checkEnrollment(courseId: number): Observable<{ enrolled: boolean; refund_eligible: boolean; status: string }> {
  return this.http.get<{ enrolled: boolean; refund_eligible: boolean; status: string }>(
    `${this.API}/courses/${courseId}/enrollment-status`
  );
}
getMyEnrollments(): Observable<{ enrollments: any[] }> {
  return this.http.get<{ enrollments: any[] }>(`${this.API}/my-courses`);
}

getStudentCourse(courseId: number): Observable<any> {
  return this.http.get<any>(`${this.API}/student/courses/${courseId}`);
}

getStudentLesson(courseId: number, lessonId: number): Observable<any> {
  return this.http.get<any>(`${this.API}/student/courses/${courseId}/lessons/${lessonId}`);
}

markLesson(courseId: number, lessonId: number): Observable<any> {
  return this.http.post<any>(
    `${this.API}/student/courses/${courseId}/lessons/${lessonId}/mark`, {}
  );
}

submitQuiz(courseId: number, quizId: number, answers: any[]): Observable<any> {
  return this.http.post<any>(
    `${this.API}/student/courses/${courseId}/quizzes/${quizId}/submit`,
    { answers }
  );
}
getStudentExam(courseId: number): Observable<any> {
  return this.http.get<any>(`${this.API}/student/courses/${courseId}/exam`);
}
}