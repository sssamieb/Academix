import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { InstructorLayoutComponent } from './features/instructor/instructor-layout/instructor-layout.component';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },

  // Rutas de autenticación (solo si NO está logueado)
{
  path: 'auth',
  children: [
    {
      path: 'login',
      canActivate: [guestGuard],
      loadComponent: () =>
        import('./features/auth/login/login.component').then(
          (m) => m.LoginComponent
        ),
    },
    {
      path: 'register',
      canActivate: [guestGuard],
      loadComponent: () =>
        import('./features/auth/register/register.component').then(
          (m) => m.RegisterComponent
        ),
    },
    {
      path: 'verify-email',
      canActivate: [guestGuard],
      loadComponent: () =>
        import('./features/auth/verify-email/verify-email.component').then(
          (m) => m.VerifyEmailComponent
        ),
    },
    {
      path: 'forgot-password',
      canActivate: [guestGuard],
      loadComponent: () =>
        import('./features/auth/forgot-password/forgot-password.component').then(
          (m) => m.ForgotPasswordComponent
        ),
    },
    {
      path: 'reset-password',
      canActivate: [guestGuard],
      loadComponent: () =>
        import('./features/auth/reset-password/reset-password.component').then(
          (m) => m.ResetPasswordComponent
        ),
    },
    // Sin guestGuard — es pública y viene de un link externo (correo)
    {
      path: 'verify-email-confirm',
      loadComponent: () =>
        import('./features/auth/verify-email-confirm/verify-email-confirm.component').then(
          (m) => m.VerifyEmailConfirmComponent
        ),
    },
    {
      path: '',
      redirectTo: 'login',
      pathMatch: 'full',
    },
  ],
},
  // Cambiar contraseña (requiere estar logueado)
  {
    path: 'auth/change-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent
      ),
  },

  // Verificación de email desde link del correo (pública, sin guard)
  {
    path: 'verify-email-confirm',
    loadComponent: () =>
      import('./features/auth/verify-email-confirm/verify-email-confirm.component').then(
        (m) => m.VerifyEmailConfirmComponent
      ),
  },

  // Google OAuth callback
  {
    path: 'auth/social-callback',
    loadComponent: () =>
      import('./features/auth/social-callback/social-callback.component').then(
        (m) => m.SocialCallbackComponent
      ),
  },

  // Dashboard estudiante
  {
    path: 'student',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/student/dashboard/dashboard.component').then(
            (m) => m.StudentDashboardComponent
          ),
      },
    ],
  },

  // Dashboard instructor
  {
  path: 'instructor',
  canActivate: [authGuard],
  component: InstructorLayoutComponent,
  children: [
    {
      path: 'dashboard',
      loadComponent: () =>
        import('./features/instructor/dashboard/dashboard.component').then(
          m => m.InstructorDashboardComponent
        ),
    },
    {
      path: 'courses',
      loadComponent: () =>
        import('./features/instructor/my-courses/my-courses.component').then(
          m => m.MyCoursesComponent
        ),
    },
    {
      path: 'courses/create',
      loadComponent: () =>
        import('./features/instructor/course-form/course-form.component').then(
          m => m.CourseFormComponent
        ),
    },
    {
  path: 'courses/:id/edit',
      loadComponent: () =>
        import('./features/instructor/course-editor/course-editor.component').then(
          m => m.CourseEditorComponent
        ),
    },
    {
      path: 'courses/:id/preview',
      loadComponent: () =>
        import('./features/instructor/course-preview/course-preview.component').then(
          m => m.CoursePreviewComponent
        ),
    },
    {
      path: 'courses/:id/preview/lessons/:lessonId',
      loadComponent: () =>
        import('./features/instructor/lesson-preview/lesson-preview.component').then(
          m => m.LessonPreviewComponent
        ),
    },
    {
      path: 'courses/:id/preview/lessons/:lessonId/quiz',
      loadComponent: () =>
        import('./features/instructor/lesson-preview/lesson-preview.component').then(
          m => m.LessonPreviewComponent
        ),
    },
  ],
},

  // Dashboard admin
    {
    path: 'admin',
    canActivate: [authGuard],
    component: AdminLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard.component').then(
            m => m.AdminDashboardComponent
          ),
      },
      {
        path: 'register-instructor',
        loadComponent: () =>
          import('./features/admin/register-instructor/register-instructor.component').then(
            m => m.RegisterInstructorComponent
          ),
      },
      {
      path: 'courses',
        loadComponent: () =>
          import('./features/admin/course-review/course-review.component').then(
            m => m.CourseReviewComponent
          ),
      },
      {
        path: 'courses/:id/preview',
        loadComponent: () =>
          import('./features/admin/admin-course-preview/admin-course-preview.component').then(
            m => m.AdminCoursePreviewComponent
          ),
      },
      {
        path: 'courses/:id/preview/lessons/:lessonId',
        loadComponent: () =>
          import('./features/admin/admin-lesson-preview/admin-lesson-preview.component').then(
            m => m.AdminLessonPreviewComponent
          ),
      },
      {
        path: 'courses/:id/preview/lessons/:lessonId/quiz',
        loadComponent: () =>
          import('./features/admin/admin-lesson-preview/admin-lesson-preview.component').then(
            m => m.AdminLessonPreviewComponent
          ),
      },
    ],
  },
];