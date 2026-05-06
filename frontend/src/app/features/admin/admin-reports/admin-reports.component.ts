import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.scss'],
})
export class AdminReportsComponent implements OnInit {
  isLoading = true;
  data: any  = null;

  // Canvas refs
  revenueChart:   any;
  studentsChart:  any;
  plansChart:     any;
  categoryChart:  any;
  activeChart:    any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.http.get<any>('http://localhost:8000/api/admin/reports').subscribe({
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
    this.buildRevenueChart();
    this.buildStudentsChart();
    this.buildPlansChart();
    this.buildCategoryChart();
    this.buildActiveChart();
  }

  buildRevenueChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (this.revenueChart) this.revenueChart.destroy();

    this.revenueChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels:   this.data.monthly_revenue.map((r: any) => r.label),
        datasets: [{
          label:           'Ingresos (USD)',
          data:            this.data.monthly_revenue.map((r: any) => r.total),
          backgroundColor: 'rgba(79,70,229,0.7)',
          borderColor:     '#4F46E5',
          borderWidth:     2,
          borderRadius:    8,
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

  buildStudentsChart(): void {
    const canvas = document.getElementById('studentsChart') as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (this.studentsChart) this.studentsChart.destroy();

    this.studentsChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels:   this.data.monthly_students.map((r: any) => r.label),
        datasets: [{
          label:           'Nuevos estudiantes',
          data:            this.data.monthly_students.map((r: any) => r.count),
          borderColor:     '#10B981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          borderWidth:     2,
          fill:            true,
          tension:         0.4,
          pointBackgroundColor: '#10B981',
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

  buildPlansChart(): void {
    const canvas = document.getElementById('plansChart') as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (this.plansChart) this.plansChart.destroy();

    this.plansChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels:   this.data.revenue_by_plan.map((r: any) => r.plan),
        datasets: [{
          data:            this.data.revenue_by_plan.map((r: any) => r.total),
          backgroundColor: ['#64748B', '#F59E0B', '#4F46E5'],
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

  buildCategoryChart(): void {
    const canvas = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (this.categoryChart) this.categoryChart.destroy();

    const colors = ['#4F46E5','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#F97316'];

    this.categoryChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels:   this.data.courses_by_category.map((c: any) => c.category),
        datasets: [{
          data:            this.data.courses_by_category.map((c: any) => c.count),
          backgroundColor: colors.slice(0, this.data.courses_by_category.length),
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

  buildActiveChart(): void {
    const canvas = document.getElementById('activeChart') as HTMLCanvasElement;
    if (!canvas) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (this.activeChart) this.activeChart.destroy();

    this.activeChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Activos', 'Inactivos'],
        datasets: [{
          data:            [this.data.active_students, this.data.inactive_students],
          backgroundColor: ['#10B981', '#EF4444'],
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

  exportExcel(): void {
  const wb = XLSX.utils.book_new();

  const headerStyle = {
    font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
    fill:      { fgColor: { rgb: '4F46E5' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top:    { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left:   { style: 'thin', color: { rgb: 'CCCCCC' } },
      right:  { style: 'thin', color: { rgb: 'CCCCCC' } },
    }
  };

  // ===== HOJA 1 — CURSOS =====
  const coursesData = [
    ['#', 'Curso', 'Instructor', 'Categoría', 'Inscripciones', 'Precio (tokens)'],
    ...this.data.top_courses.map((c: any, i: number) => [
      i + 1, c.title, c.instructor, c.category, c.enrollments, c.token_price
    ])
  ];
  const wsC = XLSX.utils.aoa_to_sheet(coursesData);
  wsC['!cols'] = [
    { wch: 5  },
    { wch: 45 },
    { wch: 30 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
  ];
  wsC['!rows'] = [{ hpt: 24 }];
  XLSX.utils.book_append_sheet(wb, wsC, 'Cursos');

  // ===== HOJA 2 — GANANCIAS POR DÍA =====
  const paymentsRaw = this.data.monthly_revenue;
  const paymentsData = [
    ['Período', 'Ingresos (USD)', 'Cantidad de pagos'],
    ...paymentsRaw.map((r: any) => [r.label, `$${r.total}`, r.count]),
    [],
    ['TOTAL', `$${this.data.totals.revenue}`, ''],
  ];
  const wsP = XLSX.utils.aoa_to_sheet(paymentsData);
  wsP['!cols'] = [
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
  ];
  wsP['!rows'] = [{ hpt: 24 }];
  XLSX.utils.book_append_sheet(wb, wsP, 'Ganancias');

  // ===== HOJA 3 — GANANCIAS POR PLAN =====
  const planData = [
    ['Plan', 'Ingresos (USD)', 'Cantidad de suscripciones'],
    ...this.data.revenue_by_plan.map((r: any) => [r.plan, `$${r.total}`, r.count]),
  ];
  const wsPl = XLSX.utils.aoa_to_sheet(planData);
  wsPl['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 28 },
  ];
  wsPl['!rows'] = [{ hpt: 24 }];
  XLSX.utils.book_append_sheet(wb, wsPl, 'Ganancias por Plan');

  // ===== HOJA 4 — ESTUDIANTES =====
  const studentsRaw: any[] = (this.data as any).students_list ?? [];
  const studentsData = [
    ['#', 'Nombre', 'Email', 'Estado', 'Plan', 'Tokens', 'Fecha de registro'],
    ...studentsRaw.map((u: any, i: number) => [
      i + 1,
      u.name,
      u.email,
      u.is_active ? 'Activo' : 'Inactivo',
      u.plan ?? 'Sin plan',
      u.tokens ?? 0,
      u.created_at,
    ])
  ];
  const wsS = XLSX.utils.aoa_to_sheet(studentsData);
  wsS['!cols'] = [
    { wch: 5  },
    { wch: 35 },
    { wch: 35 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 22 },
  ];
  wsS['!rows'] = [{ hpt: 24 }];
  XLSX.utils.book_append_sheet(wb, wsS, 'Estudiantes');

  // ===== HOJA 5 — INSTRUCTORES =====
  const instructorsRaw: any[] = (this.data as any).instructors_list ?? [];
  const instructorsData = [
    ['#', 'Nombre', 'Email', 'Estado', 'Cursos publicados', 'Fecha de registro'],
    ...instructorsRaw.map((u: any, i: number) => [
      i + 1,
      u.name,
      u.email,
      u.is_active ? 'Activo' : 'Inactivo',
      u.courses_count ?? 0,
      u.created_at,
    ])
  ];
  const wsI = XLSX.utils.aoa_to_sheet(instructorsData);
  wsI['!cols'] = [
    { wch: 5  },
    { wch: 35 },
    { wch: 35 },
    { wch: 12 },
    { wch: 20 },
    { wch: 22 },
  ];
  wsI['!rows'] = [{ hpt: 24 }];
  XLSX.utils.book_append_sheet(wb, wsI, 'Instructores');

  // ===== EXPORTAR =====
  const buf  = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  saveAs(blob, `reporte-academix-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

  ngOnDestroy(): void {
    [this.revenueChart, this.studentsChart, this.plansChart,
     this.categoryChart, this.activeChart].forEach(c => c?.destroy());
  }
}