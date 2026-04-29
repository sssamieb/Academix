// chatbot.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly API_URL = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  sendMessage(message: string, context: string, history: ChatMessage[]): Observable<{ reply: string }> {
    const endpoint = context === 'landing' ? '/chatbot' : '/chatbot/authenticated';
    return this.http.post<{ reply: string }>(`${this.API_URL}${endpoint}`, {
      message,
      context,
      history
    });
  }
}