import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8000/api';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor(private http: HttpClient, private router: Router) {}

  // Registro (siempre estudiante)
  register(payload: RegisterPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/auth/register`,
      payload
    );
  }

  // Login
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/auth/login`, payload)
      .pipe(tap((res) => this.saveSession(res)));
  }

  // Logout
  logout(): void {
    this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  // Recuperar contraseña
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/auth/forgot-password`,
      { email }
    );
  }

  // Resetear contraseña
  resetPassword(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/auth/reset-password`,
      payload
    );
  }

  // Cambiar contraseña temporal
  changePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/auth/change-password`,
      payload
    );
  }
  confirmVerifyEmail(params: { id: string; hash: string; expires: string; signature: string }) {
  return this.http.get(`${this.API_URL}/auth/verify-email/${params.id}/${params.hash}`, {
    params: { expires: params.expires, signature: params.signature }
  });
}

  // Reenviar verificación
  resendVerification(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/auth/resend-verification`,
      { email }
    );
  }
  //popup de google
loginWithGoogle(): void {
  const width  = 500;
  const height = 600;
  const left   = window.screenX + (window.outerWidth - width) / 2;
  const top    = window.screenY + (window.outerHeight - height) / 2;

  // Abre el popup centrado
  const popup = window.open(
    'http://localhost:8000/api/auth/google/redirect',
    'Google Login',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
  );

  // Escucha el mensaje que manda el popup cuando termina
  const listener = (event: MessageEvent) => {
    if (event.origin !== 'http://localhost:4200') return;

    if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
      window.removeEventListener('message', listener);
      popup?.close();

      const { token, user } = event.data;
      this.saveSessionFromSocial(token, user);

      // Redirigir según rol
      if (user.must_change_password) {
        this.router.navigate(['/auth/change-password']);
        return;
      }

      if (user.role === 'admin')           this.router.navigate(['/admin/dashboard']);
      else if (user.role === 'instructor') this.router.navigate(['/instructor/dashboard']);
      else                                 this.router.navigate(['/student/dashboard']);
    }

    if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
      window.removeEventListener('message', listener);
      popup?.close();
      // El error se maneja en el componente
    }
  };

  window.addEventListener('message', listener);
}

// Guarda la sesión que viene del callback social
saveSessionFromSocial(token: string, user: User): void {
  localStorage.setItem(this.TOKEN_KEY, token);
  localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  this.currentUser.set(user);
}
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string | null {
    const user = this.getUserFromStorage();
    return user ? user.role : null;
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }
}