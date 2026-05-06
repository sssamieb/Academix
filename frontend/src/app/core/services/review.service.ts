import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getReviews(courseId: number): Observable<any> {
    return this.http.get(`${this.API}/courses/${courseId}/reviews`);
  }

  submitReview(courseId: number, rating: number, comment: string): Observable<any> {
    return this.http.post(`${this.API}/courses/${courseId}/reviews`, { rating, comment });
  }

  getInstructorReviews(): Observable<any> {
    return this.http.get(`${this.API}/instructor/reviews`);
  }

  getAdminReviews(): Observable<any> {
    return this.http.get(`${this.API}/admin/reviews`);
  }

  deleteReview(reviewId: number): Observable<any> {
    return this.http.delete(`${this.API}/admin/reviews/${reviewId}`);
  }
}