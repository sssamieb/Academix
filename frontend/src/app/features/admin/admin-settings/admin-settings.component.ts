import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss'],
})
export class AdminSettingsComponent implements OnInit {
  activeTab = 'categories';
  private readonly API = 'http://localhost:8000/api/admin/settings';

  // Categorías
  categories:     any[] = [];
  isLoadingCats   = true;
  categoryForm!:  FormGroup;
  editingCategory: any  = null;
  isSavingCat     = false;
  showCategoryForm = false;

  // Planes
  plans:         any[] = [];
  isLoadingPlans = true;
  editingPlan:   any   = null;
  planForm!:     FormGroup;
  isSavingPlan   = false;

  // Iconos disponibles
  availableIcons = [
    'bi-globe', 'bi-phone-fill', 'bi-cpu-fill', 'bi-palette-fill',
    'bi-graph-up', 'bi-shield-lock-fill', 'bi-box-seam', 'bi-database-fill',
    'bi-code-slash', 'bi-router-fill', 'bi-megaphone-fill', 'bi-briefcase-fill',
    'bi-brush-fill', 'bi-camera-video-fill', 'bi-translate', 'bi-cash-coin',
    'bi-lightning-fill', 'bi-music-note-beamed', 'bi-mortarboard-fill', 'bi-book-fill',
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadPlans();
  }

  // ===== CATEGORÍAS =====
  loadCategories(): void {
    this.http.get<any>(`${this.API}/categories`).subscribe({
      next: (res) => {
        this.categories   = res.categories;
        this.isLoadingCats = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingCats = false; }
    });
  }

  openCategoryForm(category?: any): void {
    this.editingCategory  = category ?? null;
    this.showCategoryForm = true;
    this.categoryForm     = this.fb.group({
      name: [category?.name ?? '', [Validators.required, Validators.minLength(2)]],
      icon: [category?.icon ?? 'bi-mortarboard-fill', Validators.required],
    });
    this.cdr.detectChanges();
  }

  closeCategoryForm(): void {
    this.showCategoryForm = false;
    this.editingCategory  = null;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid || this.isSavingCat) return;
    this.isSavingCat = true;

    const req = this.editingCategory
      ? this.http.put<any>(`${this.API}/categories/${this.editingCategory.id}`, this.categoryForm.value)
      : this.http.post<any>(`${this.API}/categories`, this.categoryForm.value);

    req.subscribe({
      next: (res) => {
        if (this.editingCategory) {
          const idx = this.categories.findIndex(c => c.id === this.editingCategory.id);
          if (idx !== -1) this.categories[idx] = res.category;
        } else {
          this.categories.push(res.category);
        }
        this.isSavingCat      = false;
        this.showCategoryForm = false;
        this.editingCategory  = null;
        Swal.fire({
          title: this.editingCategory ? '¡Categoría actualizada!' : '¡Categoría creada!',
          icon: 'success', timer: 1500, showConfirmButton: false,
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingCat = false;
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo guardar la categoría.',
          icon: 'error', confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  async deleteCategory(category: any): Promise<void> {
    const result = await Swal.fire({
      title: `¿Eliminar "${category.name}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });
    if (!result.isConfirmed) return;

    this.http.delete<any>(`${this.API}/categories/${category.id}`).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== category.id);
        this.cdr.detectChanges();
        Swal.fire({ title: 'Eliminada', icon: 'success', timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        Swal.fire({ title: 'Error', text: err.error?.message, icon: 'error', confirmButtonColor: '#4F46E5' });
      }
    });
  }

  // ===== PLANES =====
  loadPlans(): void {
    this.http.get<any>(`${this.API}/plans`).subscribe({
      next: (res) => {
        this.plans          = res.plans;
        this.isLoadingPlans = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoadingPlans = false; }
    });
  }

  openPlanForm(plan: any): void {
    this.editingPlan = plan;
    this.planForm    = this.fb.group({
      price:              [plan.price,              [Validators.required, Validators.min(0)]],
      monthly_tokens:     [plan.monthly_tokens,     [Validators.required, Validators.min(0)]],
      quiz_attempts:      [plan.quiz_attempts,      [Validators.required, Validators.min(1)]],
      exam_attempts:      [plan.exam_attempts,      [Validators.required, Validators.min(1)]],
      unlimited_attempts: [plan.unlimited_attempts, Validators.required],
      unlimited_tokens:   [plan.unlimited_tokens,   Validators.required],
    });
    this.cdr.detectChanges();
  }

  closePlanForm(): void {
    this.editingPlan = null;
  }

  savePlan(): void {
    if (this.planForm.invalid || this.isSavingPlan) return;
    this.isSavingPlan = true;

    this.http.put<any>(`${this.API}/plans/${this.editingPlan.id}`, this.planForm.value).subscribe({
      next: (res) => {
        const idx = this.plans.findIndex(p => p.id === this.editingPlan.id);
        if (idx !== -1) this.plans[idx] = res.plan;
        this.isSavingPlan = false;
        this.editingPlan  = null;
        Swal.fire({ title: '¡Plan actualizado!', icon: 'success', timer: 1500, showConfirmButton: false });
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingPlan = false;
        Swal.fire({ title: 'Error', text: 'No se pudo actualizar el plan.', icon: 'error', confirmButtonColor: '#4F46E5' });
      }
    });
  }

  getPlanColor(type: string): string {
    return { basic: '#64748B', pro: '#F59E0B', premium: '#4F46E5' }[type] ?? '#64748B';
  }

  getPlanIcon(type: string): string {
    return { basic: 'bi-box', pro: 'bi-lightning-fill', premium: 'bi-gem' }[type] ?? 'bi-box';
  }
}