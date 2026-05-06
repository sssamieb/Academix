import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getPlans(): Observable<{ plans: any[] }> {
    return this.http.get<{ plans: any[] }>(`${this.API}/plans`);
  }

  getStatus(): Observable<any> {
    return this.http.get<any>(`${this.API}/subscription/status`);
  }

  checkout(planType: string): Observable<{ checkout_url: string }> {
    return this.http.post<{ checkout_url: string }>(`${this.API}/subscription/checkout`, {
      plan_type: planType,
    });
  }

  cancel(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/subscription/cancel`, {});
  }
}