// instructor-course.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Course {
  id:                number;
  title:             string;
  slug:              string;
  short_description: string;
  description:       string;
  category_id:       number;
  level:             'basico' | 'intermedio' | 'avanzado';
  status:            'draft' | 'in_review' | 'rejected' | 'published' | 'unpublished';
  token_price:       number | null;
  rejection_reason:  string | null;
  thumbnail:         string | null;
  submitted_at:      string | null;
  approved_at:       string | null;
  enrollments_count: number;
  category:          { id: number; name: string; icon: string };
}

export interface CourseCategory {
  id:   number;
  name: string;
  icon: string;
}
export interface Section {
  id:                   number;
  title:                string;
  order:                number;
  is_presentation:      boolean;
  is_final_exam:        boolean;
  presentation_content: string | null;
  lessons:              Lesson[];
}

export interface Lesson {
  id:              number;
  title:           string;
  type:            'video' | 'article';
  video_url:       string | null;
  article_content: string | null;
  notes:           string | null;
  duration:        number | null;
  order:           number;
  is_preview:      boolean;
  quiz:            QuizData | null;
}

export interface QuizData {
  id:                 number;
  title:              string;
  type:               'practice' | 'exam';
  passing_score:      number;
  is_active:          boolean;
  time_limit_minutes: number;
  questions:          QuizQuestion[];
}
export interface QuizQuestion {
  id:       number;
  question: string;
  order:    number;
  options:  QuizOption[];
}

export interface QuizOption {
  id:          number;
  option_text: string;
  is_correct:  boolean;
}

@Injectable({ providedIn: 'root' })
export class InstructorCourseService {
  private readonly API = 'http://localhost:8000/api/instructor';

  constructor(private http: HttpClient) {}

  getCourses(): Observable<{ courses: Course[] }> {
    return this.http.get<{ courses: Course[] }>(`${this.API}/courses`);
  }

  getCourse(id: number): Observable<{ course: Course }> {
    return this.http.get<{ course: Course }>(`${this.API}/courses/${id}`);
  }

  createCourse(data: any): Observable<{ message: string; course: Course }> {
  return this.http.post<{ message: string; course: Course }>(`${this.API}/courses`, data);
  }

  updateCourse(id: number, data: Partial<Course>): Observable<{ message: string; course: Course }> {
    return this.http.put<{ message: string; course: Course }>(`${this.API}/courses/${id}`, data);
  }

  submitForReview(id: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/courses/${id}/submit`, {});
  }

  getCategories(): Observable<{ categories: CourseCategory[] }> {
    return this.http.get<{ categories: CourseCategory[] }>(`${this.API}/categories`);
  }
  addSection(courseId: number, title: string): Observable<{ section: Section }> {
  return this.http.post<{ section: Section }>(`${this.API}/courses/${courseId}/sections`, { title });
}

updateSection(courseId: number, sectionId: number, data: Partial<Section>): Observable<{ section: Section }> {
  return this.http.put<{ section: Section }>(`${this.API}/courses/${courseId}/sections/${sectionId}`, data);
}

deleteSection(courseId: number, sectionId: number): Observable<{ message: string }> {
  return this.http.delete<{ message: string }>(`${this.API}/courses/${courseId}/sections/${sectionId}`);
}

// Lecciones
addLesson(courseId: number, sectionId: number, title: string): Observable<{ lesson: Lesson }> {
  return this.http.post<{ lesson: Lesson }>(`${this.API}/courses/${courseId}/sections/${sectionId}/lessons`, { title });
}

updateLesson(courseId: number, sectionId: number, lessonId: number, data: Partial<Lesson>): Observable<{ lesson: Lesson }> {
  return this.http.put<{ lesson: Lesson }>(`${this.API}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, data);
}

deleteLesson(courseId: number, sectionId: number, lessonId: number): Observable<{ message: string }> {
  return this.http.delete<{ message: string }>(`${this.API}/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);
}

// Quiz
updateQuiz(courseId: number, quizId: number, data: Partial<QuizData>): Observable<{ quiz: QuizData }> {
  return this.http.put<{ quiz: QuizData }>(`${this.API}/courses/${courseId}/quizzes/${quizId}`, data);
}
getCoursePreview(id: number): Observable<{ course: Course }> {
  return this.http.get<{ course: Course }>(`${this.API}/courses/${id}/preview`);
}
toggleQuiz(courseId: number, quizId: number, isActive: boolean): Observable<{ quiz: QuizData }> {
  return this.http.put<{ quiz: QuizData }>(`${this.API}/courses/${courseId}/quizzes/${quizId}`, {
    is_active: isActive
  });
}
deleteCourse(id: number): Observable<{ message: string }> {
  return this.http.delete<{ message: string }>(`${this.API}/courses/${id}`);
}
}