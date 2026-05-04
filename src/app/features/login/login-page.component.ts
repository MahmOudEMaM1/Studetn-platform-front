import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { appRouteLinks } from '../../core/routing/app-route-paths';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { AuthApiService } from '../../data-access/auth/auth-api.service';
import { LoginRole } from '../../data-access/auth/auth.models';

interface RoleOption {
  readonly value: LoginRole;
  readonly label: string;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly role = signal<LoginRole>('admin');
  protected readonly rememberMe = signal(true);
  protected readonly showPassword = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly submitAttempted = signal(false);
  protected readonly submitError = signal('');
  protected readonly routeLinks = appRouteLinks;

  protected readonly roleOptions: RoleOption[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' }
  ];

  protected readonly canSubmit = computed(
    () => this.username().trim().length > 0 && this.password().trim().length > 0
  );

  protected submitLogin(): void {
    this.submitAttempted.set(true);
    this.submitError.set('');

    if (!this.canSubmit() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    this.authApi
      .login({
        username: this.username().trim(),
        password: this.password(),
        device_name: 'postman-admin',
        role: this.role()
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.authSession.startSession(response, this.rememberMe());
          this.isSubmitting.set(false);
          void this.router.navigateByUrl(this.authSession.getDashboardRoute(this.role()));
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.submitError.set(this.extractErrorMessage(error));
        }
      });
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const fallbackMessage = 'Sign in failed. Please verify your credentials and try again.';
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }
}
