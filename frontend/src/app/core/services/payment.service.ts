import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getHistory(): Observable<{ payments: any[] }> {
    return this.http.get<{ payments: any[] }>(`${this.API}/payments/history`);
  }
}