import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-social-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-container">
      <div class="spinner-box">
        <div class="spinner"></div>
        <p>Iniciando sesión con Google...</p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .spinner-box {
      text-align: center;
      color: white;
      font-size: 1.1rem;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SocialCallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const token   = this.route.snapshot.queryParams['token'];
    const userStr = this.route.snapshot.queryParams['user'];
    const error   = this.route.snapshot.queryParams['error'];

    // Si hay error manda mensaje al padre y cierra
    if (error) {
      window.opener?.postMessage(
        { type: 'GOOGLE_AUTH_ERROR', error },
        'http://localhost:4200'
      );
      window.close();
      return;
    }

    if (!token || !userStr) {
      window.opener?.postMessage(
        { type: 'GOOGLE_AUTH_ERROR', error: 'Error desconocido.' },
        'http://localhost:4200'
      );
      window.close();
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userStr));

      // Manda el token y usuario a la ventana padre
      window.opener?.postMessage(
        { type: 'GOOGLE_AUTH_SUCCESS', token, user },
        'http://localhost:4200'
      );

      // Cierra el popup
      window.close();

    } catch (e) {
      window.opener?.postMessage(
        { type: 'GOOGLE_AUTH_ERROR', error: 'Error al procesar la respuesta.' },
        'http://localhost:4200'
      );
      window.close();
    }
  }
}