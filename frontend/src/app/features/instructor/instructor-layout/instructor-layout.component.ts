import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InstructorProfileService } from '../../../core/services/instructor-profile.service';
import { User } from '../../../core/models/user.model';
import { ChatbotWidgetComponent } from '../../chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-instructor-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, ChatbotWidgetComponent],
  templateUrl: './instructor-layout.component.html',
  styleUrls: ['./instructor-layout.component.scss'],
})
export class InstructorLayoutComponent implements OnInit {
  user: User | null;
  avatarColor    = '#4F46E5';
  isScrolled     = false;
  avatarMenuOpen = false;

  constructor(
    private authService: AuthService,
    private profileService: InstructorProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.user = this.authService.currentUser();
  }

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        this.avatarColor = res.profile?.avatar_color ?? '#4F46E5';
        this.cdr.detectChanges();
      }
    });
  }

  get showNewCourseBtn(): boolean {
    return !this.router.url.startsWith('/instructor/courses');
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
  logout(): void     { this.authService.logout(); }
}