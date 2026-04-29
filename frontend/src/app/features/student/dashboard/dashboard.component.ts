import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { ChatbotWidgetComponent } from '../../chatbot-widget/chatbot-widget.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatbotWidgetComponent ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class StudentDashboardComponent {
  user: User | null;
  isScrolled      = false;
  searchQuery     = '';
  showSearchResults = false;
  avatarMenuOpen  = false;

  // Plan y tokens
  planName     = 'Plan Pro';
  tokens       = 340;
  maxTokens    = 500;
  get tokenPercent() { return (this.tokens / this.maxTokens) * 100; }

  stats = {
    enrolled:   4,
    completed:  1,
    inProgress: 3,
    hours:      '42',
  };

  myCourses = [
    {
      id: 1, title: 'Angular & TypeScript desde cero',
      instructor: 'Carlos Mendoza', icon: 'bi-code-slash', color: '#4F46E5',
      progress: 68, totalLessons: 48, doneLessons: 33,
      category: 'Desarrollo Web', lastAccess: 'Hoy', status: 'progress',
    },
    {
      id: 2, title: 'Laravel API REST completo',
      instructor: 'Ana González', icon: 'bi-server', color: '#EF4444',
      progress: 35, totalLessons: 36, doneLessons: 13,
      category: 'Backend', lastAccess: 'Ayer', status: 'progress',
    },
    {
      id: 3, title: 'MySQL para desarrolladores',
      instructor: 'Pedro Ruiz', icon: 'bi-database-fill', color: '#F59E0B',
      progress: 100, totalLessons: 24, doneLessons: 24,
      category: 'Base de datos', lastAccess: 'Hace 3 días', status: 'completed',
    },
    {
      id: 4, title: 'Diseño UX/UI con Figma',
      instructor: 'Laura Torres', icon: 'bi-vector-pen', color: '#10B981',
      progress: 12, totalLessons: 30, doneLessons: 4,
      category: 'Diseño', lastAccess: 'Hace 1 semana', status: 'progress',
    },
  ];

  suggestedCourses = [
    {
      id: 5, title: 'React desde cero',
      instructor: 'Carlos Mendoza', icon: 'bi-braces', color: '#06B6D4',
      rating: 4.8, students: 1240, tokenCost: 80,
      category: 'Desarrollo Web', reason: 'Basado en tu curso de Angular',
    },
    {
      id: 6, title: 'Docker y DevOps',
      instructor: 'Ana González', icon: 'bi-box-seam', color: '#2D2D7B',
      rating: 4.7, students: 890, tokenCost: 100,
      category: 'DevOps', reason: 'Complementa tu curso de Laravel',
    },
    {
      id: 7, title: 'PostgreSQL avanzado',
      instructor: 'Pedro Ruiz', icon: 'bi-database', color: '#7C3AED',
      rating: 4.9, students: 654, tokenCost: 60,
      category: 'Base de datos', reason: 'Siguiendo tu interés en MySQL',
    },
  ];

  allCourses = [
    { id: 5,  title: 'React desde cero',         category: 'Desarrollo Web', icon: 'bi-braces',         color: '#06B6D4', rating: 4.8, instructor: 'Carlos Mendoza' },
    { id: 6,  title: 'Docker y DevOps',           category: 'DevOps',         icon: 'bi-box-seam',       color: '#2D2D7B', rating: 4.7, instructor: 'Ana González'   },
    { id: 7,  title: 'PostgreSQL avanzado',       category: 'Base de datos',  icon: 'bi-database',       color: '#7C3AED', rating: 4.9, instructor: 'Pedro Ruiz'     },
    { id: 8,  title: 'Python para Data Science',  category: 'Data Science',   icon: 'bi-bar-chart-fill', color: '#F59E0B', rating: 4.6, instructor: 'María García'   },
    { id: 9,  title: 'Ciberseguridad básica',     category: 'Seguridad',      icon: 'bi-shield-lock',    color: '#EF4444', rating: 4.5, instructor: 'Luis Martín'    },
    { id: 10, title: 'Vue.js completo',           category: 'Desarrollo Web', icon: 'bi-code-square',    color: '#10B981', rating: 4.7, instructor: 'Sofía López'    },
  ];

  get searchResults() {
    if (!this.searchQuery.trim()) return [];
    return this.allCourses.filter(c =>
      c.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      c.instructor.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  constructor(private authService: AuthService) {
    this.user = this.authService.currentUser();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 10;
  }

  getInitials(): string {
    if (!this.user?.name) return 'E';
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
  getFirstName(): string {
  if (!this.user?.name) return '';
  return this.user.name.split(' ')[0];
}

  toggleAvatarMenu(): void { this.avatarMenuOpen = !this.avatarMenuOpen; }
  onSearchFocus(): void { this.showSearchResults = true; }
  onSearchBlur(): void { setTimeout(() => { this.showSearchResults = false; }, 200); }
  logout(): void { this.authService.logout(); }
}