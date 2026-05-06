import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
})
export class PlansComponent implements OnInit {
  plans:        any[]    = [];
  currentStatus: any     = null;
  isLoading     = true;
  processingPlan = '';

  planConfig: Record<string, any> = {
    basic: {
      icon:     'bi-rocket',
      color:    '#4F46E5',
      features: [
        { text: '200 tokens mensuales',              included: true  },
        { text: 'Certificados digitales estándar',   included: true  },
        { text: 'Soporte por email (48h)',            included: true  },
        { text: 'Tokens acumulables',                included: false },
        { text: 'Soporte prioritario',               included: false },
        { text: 'Tokens ilimitados',                 included: false },
        { text: 'Certificación avalada por el Estado', included: false },
      ],
    },
    pro: {
      icon:     'bi-rocket-takeoff-fill',
      color:    '#06B6D4',
      popular:  true,
      features: [
        { text: '600 tokens mensuales',              included: true },
        { text: 'Tokens acumulables',                included: true },
        { text: 'Soporte prioritario',               included: true },
        { text: 'Bonificación de tokens extra',      included: true },
        { text: 'Descuentos en tokens adicionales',  included: true },
        { text: 'Certificados personalizados',       included: true },
        { text: 'Certificación avalada por el Estado', included: false },
      ],
    },
    premium: {
      icon:     'bi-gem',
      color:    '#F59E0B',
      features: [
        { text: 'Tokens ilimitados',                 included: true },
        { text: 'Todo lo del plan Pro',              included: true },
        { text: 'Certificación avalada por el Estado', included: true },
        { text: 'Acceso anticipado a nuevos cursos', included: true },
        { text: 'Intentos ilimitados en exámenes',   included: true },
        { text: 'Perfil de estudiante destacado',    included: true },
        { text: 'Consulta directa a instructores',   included: true },
      ],
    },
  };

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.subscriptionService.getStatus().subscribe({
      next: (res) => {
        this.currentStatus = res;
        this.isLoading     = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  getConfig(planType: string): any {
    return this.planConfig[planType] ?? {};
  }

  isCurrentPlan(planType: string): boolean {
    return this.currentStatus?.plan?.type === planType &&
           this.currentStatus?.subscription_status === 'active';
  }

  async subscribe(plan: any): Promise<void> {
    if (this.isCurrentPlan(plan.type)) return;

    const result = await Swal.fire({
      title: `Suscribirse al plan ${plan.name}`,
      html: `Serás redirigido a Stripe para completar el pago de <strong>$${plan.price}/mes</strong>.<br><br>`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Ir al pago',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#64748B',
    });

    if (!result.isConfirmed) return;

    this.processingPlan = plan.type;

    this.subscriptionService.checkout(plan.type).subscribe({
      next: (res) => {
        window.location.href = res.checkout_url;
      },
      error: (err) => {
        this.processingPlan = '';
        Swal.fire({
          title: 'Error',
          text: err.error?.message || 'No se pudo procesar el pago.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  async cancelSubscription(): Promise<void> {
    const result = await Swal.fire({
      title: '¿Cancelar suscripción?',
      text: 'Perderás acceso a los beneficios del plan al final del período actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Mantener plan',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B',
    });

    if (!result.isConfirmed) return;

    this.subscriptionService.cancel().subscribe({
      next: () => {
        this.loadData();
        Swal.fire({
          title: 'Suscripción cancelada',
          text: 'Tu suscripción fue cancelada exitosamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  }
}