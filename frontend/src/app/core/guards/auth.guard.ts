import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Si debe cambiar contraseña, redirigir ahí
    const user = authService.currentUser();
    if (user?.must_change_password) {
      router.navigate(['/auth/change-password']);
      return false;
    }
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  const role = authService.getUserRole();
  if (role === 'admin')           router.navigate(['/admin/dashboard']);
  else if (role === 'instructor') router.navigate(['/instructor/dashboard']);
  else                            router.navigate(['/student/dashboard']);

  return false;
};