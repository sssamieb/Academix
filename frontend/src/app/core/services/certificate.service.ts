import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly API = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

getCertificates(): Observable<{ certificates: any[]; user_plan?: string }> {
  return this.http.get<{ certificates: any[]; user_plan?: string }>(`${this.API}/certificates`);
}

  downloadCertificate(certificateId: number): void {
  const token = localStorage.getItem('auth_token');
  window.open(`http://localhost:8000/api/certificates/${certificateId}/download?token=${token}`, '_blank');
}
viewCertificate(certificateId: number): void {
  // navegación — agregar en el componente que lo llame
}
}