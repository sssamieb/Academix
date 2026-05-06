import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { InstructorLayoutComponent } from './features/instructor/instructor-layout/instructor-layout.component';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { StudentLayoutComponent } from './features/student/student-layout/student-layout.component';

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
  component: StudentLayoutComponent,
  children: [
    {
      path: 'dashboard',
      loadComponent: () =>
        import('./features/student/dashboard/dashboard.component').then(
          m => m.StudentDashboardComponent
        ),
    },
    {
      path: 'explore',
      loadComponent: () =>
        import('./features/student/explore/explore.component').then(
          m => m.ExploreComponent
        ),
    },
    {
      path: 'plans',
      loadComponent: () =>
        import('./features/student/plans/plans.component').then(
          m => m.PlansComponent
        ),
    },
    {
      path: 'subscription/success',
      loadComponent: () =>
        import('./features/student/subscription-success/subscription-success.component').then(
          m => m.SubscriptionSuccessComponent
        ),
    },
    {
      path: 'courses/:id',           // ← detalle público para inscribirse
      loadComponent: () =>
        import('./features/student/course-detail/course-detail.component').then(
          m => m.CourseDetailComponent
        ),
    },
    {
      path: 'my-courses/:id',        // ← curso para estudiante inscripto
      loadComponent: () =>
        import('./features/student/student-course/student-course.component').then(
          m => m.StudentCourseComponent
        ),
    },
    {
      path: 'my-courses/:id/lessons/:lessonId',
      loadComponent: () =>
        import('./features/student/student-lesson/student-lesson.component').then(
          m => m.StudentLessonComponent
        ),
    },
    {
      path: 'my-courses/:id/lessons/:lessonId/quiz',
      loadComponent: () =>
        import('./features/student/student-lesson/student-lesson.component').then(
          m => m.StudentLessonComponent
        ),
    },
    {
      path: 'profile',
      loadComponent: () =>
        import('./features/student/student-profile/student-profile.component').then(
          m => m.StudentProfileComponent
        ),
    },
    {
        path: 'my-courses/:id/exam',
        loadComponent: () =>
          import('./features/student/student-exam/student-exam.component').then(
            m => m.StudentExamComponent
          ),
      },
      {
  path: 'certificates',
  loadComponent: () =>
    import('./features/student/student-certificates/student-certificates.component').then(
      m => m.StudentCertificatesComponent
    ),
},
{
  path: 'certificates/:id/view',
  loadComponent: () =>
    import('./features/student/certificate-renderer/certificate-renderer.component').then(
      m => m.CertificateRendererComponent
    ),
},
{
  path: 'my-courses/:id/forum',
  loadComponent: () =>
    import('./features/student/student-forum/student-forum.component').then(
      m => m.StudentForumComponent
    ),
},
{
  path: 'my-courses/:id/reviews',
  loadComponent: () =>
    import('./features/student/student-reviews/student-reviews.component').then(
      m => m.StudentReviewsComponent
    ),
},
{
  path: 'settings',
  loadComponent: () =>
    import('./features/student/student-settings/student-settings.component').then(
      m => m.StudentSettingsComponent
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
    {
      path: 'profile',
      loadComponent: () =>
        import('./features/instructor/instructor-profile/instructor-profile.component').then(
          m => m.InstructorProfileComponent
        ),
    },
    {
      path: 'forum',
      loadComponent: () =>
        import('./features/instructor/instructor-forum/instructor-forum.component').then(
          m => m.InstructorForumComponent
        ),
    },
    {
      path: 'reviews',
      loadComponent: () =>
        import('./features/instructor/instructor-reviews/instructor-reviews.component').then(
          m => m.InstructorReviewsComponent
        ),
    },
    {
      path: 'settings',
      loadComponent: () =>
        import('./features/instructor/instructor-settings/instructor-settings.component').then(
          m => m.InstructorSettingsComponent
        ),
    },
    {
      path: 'students',
      loadComponent: () =>
        import('./features/instructor/instructor-students/instructor-students.component').then(
          m => m.InstructorStudentsComponent
        ),
    },
    {
      path: 'stats',
      loadComponent: () =>
        import('./features/instructor/instructor-stats/instructor-stats.component').then(
          m => m.InstructorStatsComponent
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
      {
        path: 'instructors',
        loadComponent: () =>
          import('./features/admin/admin-instructors/admin-instructors.component').then(
            m => m.AdminInstructorsComponent
          ),
      },
      {
        path: 'students',
        loadComponent: () =>
          import('./features/admin/admin-students/admin-students.component').then(
            m => m.AdminStudentsComponent
          ),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./features/admin/admin-reviews/admin-reviews.component').then(
            m => m.AdminReviewsComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/admin-reports/admin-reports.component').then(
            m => m.AdminReportsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/admin-settings/admin-settings.component').then(
            m => m.AdminSettingsComponent
          ),
      },
    ],
  },
  {
  path: 'terms',
  loadComponent: () =>
    import('./features/terms/terms.component').then(
      m => m.TermsComponent
    ),
},
{
  path: 'privacy',
  loadComponent: () =>
    import('./features/privacy/privacy.component').then(
      m => m.PrivacyComponent
    ),
},

];