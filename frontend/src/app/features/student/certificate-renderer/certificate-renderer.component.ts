import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CertificateService } from '../../../core/services/certificate.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-certificate-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate-renderer.component.html',
  styleUrls: ['./certificate-renderer.component.scss'],
})
export class CertificateRendererComponent implements OnInit {
  @ViewChild('certRef') certRef!: ElementRef;

  certificate: any = null;
  userPlan      = 'basic';
  isLoading     = true;
  isDownloading = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private certificateService: CertificateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.certificateService.getCertificates().subscribe({
      next: (res) => {
        this.certificate = res.certificates.find((c: any) => c.id === id);
        this.userPlan    = res.user_plan ?? 'basic';
        this.isLoading   = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  get certType(): string {
    return this.userPlan;
  }

  get studentName(): string {
    return this.certificate?.user?.name ?? '';
  }

  get courseName(): string {
    return this.certificate?.course?.title ?? '';
  }

  get instructorName(): string {
    return this.certificate?.course?.instructor?.name ?? '';
  }

  get issuedDate(): string {
    if (!this.certificate?.issued_at) return '';
    return new Date(this.certificate.issued_at).toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  get certCode(): string {
    return this.certificate?.certificate_code ?? '';
  }

  async downloadPDF(): Promise<void> {
    if (!this.certRef) return;
    this.isDownloading = true;
    this.cdr.detectChanges();

    const el = this.certRef.nativeElement;

    // Guardar transform original y resetearlo para la captura
    const originalTransform = el.style.transform;
    const originalMargin    = el.style.margin;
    el.style.transform = 'scale(1)';
    el.style.margin    = '0';

    await new Promise(r => setTimeout(r, 300));

    const canvas = await html2canvas(el, {
      scale:    2,
      useCORS:  true,
      logging:  false,
      width:    1122,
      height:   794,
    });

    // Restaurar transform
    el.style.transform = originalTransform;
    el.style.margin    = originalMargin;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1122, 794] });
    pdf.addImage(imgData, 'PNG', 0, 0, 1122, 794);
    pdf.save(`certificado-${this.certCode}.pdf`);

    this.isDownloading = false;
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.router.navigate(['/student/certificates']);
  }
}