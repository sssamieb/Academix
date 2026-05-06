import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CertificateService } from '../../../core/services/certificate.service';

@Component({
  selector: 'app-student-certificates',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './student-certificates.component.html',
  styleUrls: ['./student-certificates.component.scss'],
})
export class StudentCertificatesComponent implements OnInit {
  certificates: any[] = [];
  isLoading = true;

  constructor(
    private certificateService: CertificateService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.certificateService.getCertificates().subscribe({
      next: (res) => {
        this.certificates = res.certificates;
        this.isLoading    = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  download(certificate: any): void {
    this.certificateService.downloadCertificate(certificate.id);
  }

  getCategoryColor(name: string): string {
    const colors: Record<string, string> = {
      'Desarrollo Web':         '#4F46E5',
      'Apps Móviles':           '#8B5CF6',
      'Inteligencia Artificial':'#06B6D4',
      'Diseño UX/UI':           '#EC4899',
      'Data Science':           '#F59E0B',
      'Ciberseguridad':         '#EF4444',
      'DevOps':                 '#10B981',
      'Base de datos':          '#F97316',
      'Programación':           '#3B82F6',
    };
    return colors[name] ?? '#64748B';
  }
}