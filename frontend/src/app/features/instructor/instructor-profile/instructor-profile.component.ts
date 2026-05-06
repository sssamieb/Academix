import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InstructorProfileService } from '../../../core/services/instructor-profile.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-instructor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructor-profile.component.html',
  styleUrls: ['./instructor-profile.component.scss'],
})
export class InstructorProfileComponent implements OnInit {
  user:    any = null;
  profile: any = null;
  stats:   any = null;
  courses: any[] = [];
  isLoading = true;
  isSaving  = false;

  form = {
    title:        '',
    bio:          '',
    linkedin:     '',
    github:       '',
    twitter:      '',
    website:      '',
    avatar_color: '#4F46E5',
  };

  selectedColor = '#4F46E5';

  constructor(
    private authService: AuthService,
    private profileService: InstructorProfileService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        this.user    = res.user;
        this.profile = res.profile;
        this.stats   = res.stats;
        this.courses = res.courses;
        this.isLoading = false;

        this.form = {
          title:        res.profile.title        ?? '',
          bio:          res.profile.bio          ?? '',
          linkedin:     res.profile.linkedin     ?? '',
          github:       res.profile.github       ?? '',
          twitter:      res.profile.twitter      ?? '',
          website:      res.profile.website      ?? '',
          avatar_color: res.profile.avatar_color ?? '#4F46E5',
        };
        this.selectedColor = this.form.avatar_color;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; }
    });
  }

  get initials(): string {
    if (!this.user?.name) return 'I';
    return this.user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  }

  onColorChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedColor       = input.value;
    this.form.avatar_color   = input.value;
  }

  save(): void {
    if (this.isSaving) return;
    this.isSaving = true;

    this.profileService.updateProfile(this.form).subscribe({
      next: (res) => {
        this.profile  = res.profile;
        this.isSaving = false;
        Swal.fire({
          title: '¡Guardado!',
          text: 'Tu perfil fue actualizado.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSaving = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar el perfil.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    });
  }

  getCategoryColor(categoryName: string): string {
    const colors: Record<string, string> = {
      'Desarrollo Web':         '#4F46E5',
      'Apps Móviles':           '#8B5CF6',
      'Inteligencia Artificial':'#06B6D4',
      'Diseño UX/UI':           '#EC4899',
      'Data Science':           '#F59E0B',
      'Ciberseguridad':         '#EF4444',
      'DevOps':                 '#10B981',
      'Base de datos':          '#F97316',
      'Programación':           '#3B82F6',
    };
    return colors[categoryName] ?? '#64748B';
  }
}