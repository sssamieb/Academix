import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ChatbotWidgetComponent } from '../../chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-instructor-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ChatbotWidgetComponent],
  templateUrl: './instructor-layout.component.html',
  styleUrls: ['./instructor-layout.component.scss'],
})
export class InstructorLayoutComponent {
  user: User | null;
  isScrolled     = false;
  avatarMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.user = this.authService.currentUser();
  }

  get showNewCourseBtn(): boolean {
    // Ocultar en /instructor/courses y /instructor/courses/create
    const url = this.router.url;
    return !url.startsWith('/instructor/courses');
  }

  @HostListener('window:scroll')
  onWindowScroll(): void { this.isScrolled = window.scrollY > 10; }

  toggleAvatarMenu(): void { this.avatarMenuOpen = !this.avatarMenuOpen; }

  getFirstName(): string {
    if (!this.user?.name) return '';
    return this.user.name.split(' ')[0];
  }

  getInitials(): string {
    if (!this.user?.name) return 'I';
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  goToCreate(): void { this.router.navigate(['/instructor/courses/create']); }
  logout(): void { this.authService.logout(); }
}