import { Component, HostListener, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ChatbotWidgetComponent } from '../../chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet, ChatbotWidgetComponent],
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.scss'],
})
export class StudentLayoutComponent implements OnInit {
  user: User | null = null;
  isScrolled        = false;
  avatarMenuOpen    = false;
  searchQuery       = '';
  showSearchResults = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.refreshUser().subscribe({
      next: (user) => {
        this.user = user;
        this.cdr.detectChanges();
      }
    });

    // Escuchar cambios del signal sin effect()
    this.authService.currentUser;
  }

  // Getter que lee el signal directamente en el template
  get currentUserFromSignal(): User | null {
    return this.authService.currentUser();
  }

  get tokens(): number {
    return this.currentUserFromSignal?.tokens ?? this.user?.tokens ?? 0;
  }

  get planName(): string {
    const u = this.currentUserFromSignal ?? this.user;
    if (!u?.plan) return 'Sin plan';
    return u.plan.name;
  }

  get avatarColor(): string {
    const u = this.currentUserFromSignal ?? this.user;
    return u?.avatar_color ?? '#4F46E5';
  }

  get currentUserName(): string {
    return this.currentUserFromSignal?.name ?? this.user?.name ?? '';
  }

  @HostListener('window:scroll')
  onWindowScroll(): void { this.isScrolled = window.scrollY > 10; }

  toggleAvatarMenu(): void { this.avatarMenuOpen = !this.avatarMenuOpen; }
  onSearchFocus(): void    { this.showSearchResults = true; }
  onSearchBlur(): void     { setTimeout(() => { this.showSearchResults = false; }, 200); }

  getInitials(): string {
    const name = this.currentUserName;
    if (!name) return 'E';
    return name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  goToDashboard(): void { this.router.navigate(['/student/dashboard']); }
  logout(): void        { this.authService.logout(); }
}