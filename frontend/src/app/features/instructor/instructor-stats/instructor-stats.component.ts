import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-instructor-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './instructor-stats.component.html',
  styleUrls: ['./instructor-stats.component.scss'],
})
export class InstructorStatsComponent implements OnInit {
  isLoading = true;
  data: any  = null;

  enrollmentsChart: any;
  monthlyChart:     any;
  statusChart:      any;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<any>('http://localhost:8000/api/instructor/stats').subscribe({
      next: (res) => {
        this.data     = res;
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.buildCharts(), 100);
      },
      error: () => { this.isLoading = false; }
    });
  }

  buildCharts(): void {
    this.buildEnrollmentsChart();
    this.buildMonthlyChart();
    this.buildStatusChart();
  }

  buildEnrollmentsChart(): void {
    const canvas = document.getElementById('enrollmentsChart') as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;
    if (this.enrollmentsChart) this.enrollmentsChart.destroy();

    const colors = ['#4F46E5','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6'];

    this.enrollmentsChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels:   this.data.enrollments_by_course.map((c: any) => c.title),
        datasets: [{
          label:           'Inscripciones',
          data:            this.data.enrollments_by_course.map((c: any) => c.enrollments),
          backgroundColor: colors,
          borderRadius:    8,
          borderWidth:     0,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false }, ticks: { maxRotation: 30 } },
        }
      }
    });
  }

  buildMonthlyChart(): void {
    const canvas = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;
    if (this.monthlyChart) this.monthlyChart.destroy();

    this.monthlyChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels:   this.data.monthly_enrollments.map((r: any) => r.label),
        datasets: [{
          label:           'Nuevas inscripciones',
          data:            this.data.monthly_enrollments.map((r: any) => r.count),
          borderColor:     '#4F46E5',
          backgroundColor: 'rgba(79,70,229,0.1)',
          borderWidth:     2,
          fill:            true,
          tension:         0.4,
          pointBackgroundColor: '#4F46E5',
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } },
        }
      }
    });
  }

  buildStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;
    if (this.statusChart) this.statusChart.destroy();

    const statusLabels: Record<string, string> = {
      trial: 'Prueba', active: 'Activos', completed: 'Completados', refunded: 'Reembolsados'
    };
    const statusColors: Record<string, string> = {
      trial: '#F59E0B', active: '#10B981', completed: '#4F46E5', refunded: '#EF4444'
    };

    const entries = Object.entries(this.data.enrollments_by_status);

    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels:   entries.map(([k]) => statusLabels[k] ?? k),
        datasets: [{
          data:            entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => statusColors[k] ?? '#64748B'),
          borderWidth:     0,
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } }
        }
      }
    });
  }

  ngOnDestroy(): void {
    [this.enrollmentsChart, this.monthlyChart, this.statusChart].forEach(c => c?.destroy());
  }
}