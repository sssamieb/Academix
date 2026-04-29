import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ChatbotWidgetComponent } from '../../chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ChatbotWidgetComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  user: User | null;
  sidebarCollapsed = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.user = this.authService.currentUser();
  }

  toggleSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }

  getInitials(): string {
    if (!this.user?.name) return 'A';
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  goToRegisterInstructor(): void { this.router.navigate(['/admin/register-instructor']); }
  logout(): void { this.authService.logout(); }
}