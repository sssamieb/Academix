import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-subscription-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-success.component.html',
  styleUrls: ['./subscription-success.component.scss'],
})
export class SubscriptionSuccessComponent implements OnInit {
  isLoading = true;
  plan: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private authService: AuthService
    ) {}

  ngOnInit(): void {
    setTimeout(() => {
        // Refrescar usuario Y estado de suscripción
        this.authService.refreshUser().subscribe();
        
        this.subscriptionService.getStatus().subscribe({
        next: (res) => {
            this.plan      = res.plan;
            this.isLoading = false;
        },
        error: () => { this.isLoading = false; }
        });
    }, 2000);
    }

  goToDashboard(): void {
    this.router.navigate(['/student/dashboard']);
  }

  goToExplore(): void {
    this.router.navigate(['/student/explore']);
  }
}