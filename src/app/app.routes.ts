import { Routes } from '@angular/router';
import { authGuard, dashboardRedirectGuard, roleGuard } from './core/guards/auth.guards';
import { appRoutePaths } from './core/routing/app-route-paths';

export const routes: Routes = [
  {
    path: appRoutePaths.root,
    pathMatch: 'full',
    redirectTo: appRoutePaths.login
  },
  {
    path: appRoutePaths.dashboardRedirect,
    canActivate: [dashboardRedirectGuard],
    loadComponent: () =>
      import('./features/login/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: appRoutePaths.login,
    loadComponent: () =>
      import('./features/login/login-page.component').then((m) => m.LoginPageComponent)
  },
  {
    path: appRoutePaths.aiChat,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ai-chat/ai-chat-page.component').then((m) => m.AiChatPageComponent)
  },
  {
    path: appRoutePaths.teacherAdminDashboard,
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () =>
      import('./features/teacher-admin-dashboard/teacher-admin-dashboard.component').then(
        (m) => m.TeacherAdminDashboardComponent
      )
  },
  {
    path: appRoutePaths.teacherDashboard,
    canActivate: [authGuard, roleGuard('teacher')],
    loadComponent: () =>
      import('./features/teacher-dashboard/teacher-dashboard.component').then(
        (m) => m.TeacherDashboardComponent
      )
  },
  {
    path: appRoutePaths.studentDashboard,
    canActivate: [authGuard, roleGuard('student')],
    loadComponent: () =>
      import('./features/student-dashboard/student-dashboard.component').then(
        (m) => m.StudentDashboardComponent
      )
  },
  {
    path: appRoutePaths.studentCommunity,
    canActivate: [authGuard, roleGuard('student', 'teacher')],
    loadComponent: () =>
      import('./features/student-community/student-community.component').then(
        (m) => m.StudentCommunityComponent
      )
  },
  {
    path: appRoutePaths.courseContentsDetail,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/course-contents/course-tab-detail.component').then(
        (m) => m.CourseTabDetailComponent
      )
  },
  {
    path: appRoutePaths.courseContents,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/course-contents/course-contents.component').then(
        (m) => m.CourseContentsComponent
      )
  },
  {
    path: appRoutePaths.quizDetail,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quiz/quiz-page.component').then((m) => m.QuizPageComponent)
  },
  {
    path: appRoutePaths.quiz,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quiz/quiz-page.component').then((m) => m.QuizPageComponent)
  },
  {
    path: appRoutePaths.wildcard,
    redirectTo: appRoutePaths.login
  }
];
