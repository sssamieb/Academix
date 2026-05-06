import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ForumService {
  private readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getPosts(courseId: number): Observable<any> {
    return this.http.get(`${this.API}/courses/${courseId}/forum`);
  }

  createPost(courseId: number, content: string): Observable<any> {
    return this.http.post(`${this.API}/courses/${courseId}/forum`, { content });
  }

  createReply(courseId: number, postId: number, content: string): Observable<any> {
    return this.http.post(`${this.API}/courses/${courseId}/forum/${postId}/reply`, { content });
  }

  deletePost(courseId: number, postId: number): Observable<any> {
    return this.http.delete(`${this.API}/courses/${courseId}/forum/${postId}`);
  }

  deleteReply(courseId: number, postId: number, replyId: number): Observable<any> {
    return this.http.delete(`${this.API}/courses/${courseId}/forum/${postId}/reply/${replyId}`);
  }
}