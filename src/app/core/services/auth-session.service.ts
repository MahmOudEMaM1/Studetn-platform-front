import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, tap } from 'rxjs';

import { appRouteLinks, roleDashboardRouteLinks } from '../routing/app-route-paths';
import { AuthApiService } from '../../data-access/auth/auth-api.service';
import { AuthSession, AuthUser, LoginResponse, LoginRole } from '../../data-access/auth/auth.models';

type SessionStorageMode = 'local' | 'session';

interface StoredAuthSession {
  readonly token: string;
  readonly tokenType: string;
  readonly abilities: string[];
  readonly user: AuthUser | null;
}

const AUTH_STORAGE_KEY = 'student-platform.auth-session';
const AUTH_STORAGE_MODE_KEY = 'student-platform.auth-storage-mode';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);

  private readonly session = signal<AuthSession | null>(null);
  private readonly currentUserWritable = signal<AuthUser | null>(null);
  private readonly isAuthenticatedWritable = signal(false);
  private readonly isRestoringSessionWritable = signal(false);

  readonly currentSession = this.session.asReadonly();
  readonly currentUser = this.currentUserWritable.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedWritable.asReadonly();
  readonly isRestoringSession = this.isRestoringSessionWritable.asReadonly();

  initialize(): void {
    const restoredSession = this.restoreStoredSession();

    if (!restoredSession) {
      this.clearSessionState();
      return;
    }

    this.session.set({
      ...restoredSession,
      user: restoredSession.user
    });
    this.syncDerivedState();
    this.isRestoringSessionWritable.set(true);

    this.authApi
      .getCurrentUser()
      .pipe(
        tap((user) => {
          const session = this.session();

          if (!session) {
            return;
          }

          const nextSession: AuthSession = {
            ...session,
            user
          };

          this.session.set(nextSession);
          this.persistSession(nextSession, this.getStorageMode());
          this.syncDerivedState();
        }),
        catchError((error: unknown) => {
          if (this.shouldClearSession(error)) {
            this.clear();
          }

          return EMPTY;
        }),
        tap(() => this.isRestoringSessionWritable.set(false))
      )
      .subscribe({
        complete: () => this.isRestoringSessionWritable.set(false)
      });
  }

  startSession(response: LoginResponse, rememberUser = true): void {
    const nextSession: AuthSession = {
      token: response.data.token,
      tokenType: response.data.token_type,
      abilities: response.data.abilities,
      user: response.data.user
    };

    this.session.set(nextSession);
    this.persistSession(nextSession, rememberUser ? 'local' : 'session');
    this.syncDerivedState();
  }

  clear(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_MODE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_MODE_KEY);
    this.clearSessionState();
  }

  getAuthorizationHeader(): string | null {
    const session = this.session();

    if (!session?.token) {
      return null;
    }

    return `${session.tokenType} ${session.token}`;
  }

  getCurrentUserRole(): LoginRole | null {
    const role = this.currentUserWritable()?.role;

    return role === 'student' || role === 'teacher' || role === 'admin' ? role : null;
  }

  getDashboardRoute(role = this.getCurrentUserRole()): string {
    switch (role) {
      case 'student':
        return roleDashboardRouteLinks.student;
      case 'teacher':
        return roleDashboardRouteLinks.teacher;
      case 'admin':
        return roleDashboardRouteLinks.admin;
      default:
        return appRouteLinks.login;
    }
  }

  private persistSession(session: AuthSession, storageMode: SessionStorageMode): void {
    const storage = storageMode === 'local' ? localStorage : sessionStorage;
    const otherStorage = storageMode === 'local' ? sessionStorage : localStorage;
    const storedSession: StoredAuthSession = {
      token: session.token,
      tokenType: session.tokenType,
      abilities: session.abilities,
      user: session.user
    };

    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(storedSession));
    storage.setItem(AUTH_STORAGE_MODE_KEY, storageMode);
    otherStorage.removeItem(AUTH_STORAGE_KEY);
    otherStorage.removeItem(AUTH_STORAGE_MODE_KEY);
  }

  private restoreStoredSession(): StoredAuthSession | null {
    const localSession = this.readStoredSession(localStorage);

    if (localSession) {
      return localSession;
    }

    return this.readStoredSession(sessionStorage);
  }

  private readStoredSession(storage: Storage): StoredAuthSession | null {
    const rawValue = storage.getItem(AUTH_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(rawValue) as Partial<StoredAuthSession>;

      if (
        typeof parsedValue.token !== 'string' ||
        typeof parsedValue.tokenType !== 'string' ||
        !Array.isArray(parsedValue.abilities)
      ) {
        return null;
      }

      return {
        token: parsedValue.token,
        tokenType: parsedValue.tokenType,
        abilities: parsedValue.abilities.filter(
          (ability): ability is string => typeof ability === 'string'
        ),
        user: this.isAuthUser(parsedValue.user) ? parsedValue.user : null
      };
    } catch {
      return null;
    }
  }

  private getStorageMode(): SessionStorageMode {
    const localMode = localStorage.getItem(AUTH_STORAGE_MODE_KEY);

    if (localMode === 'local') {
      return 'local';
    }

    const sessionMode = sessionStorage.getItem(AUTH_STORAGE_MODE_KEY);

    return sessionMode === 'session' ? 'session' : 'local';
  }

  private shouldClearSession(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    return error.status === 401 || error.status === 403;
  }

  private isAuthUser(value: unknown): value is AuthUser {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'username' in value &&
      'role' in value
    );
  }

  private clearSessionState(): void {
    this.session.set(null);
    this.currentUserWritable.set(null);
    this.isAuthenticatedWritable.set(false);
    this.isRestoringSessionWritable.set(false);
  }

  private syncDerivedState(): void {
    const session = this.session();

    this.currentUserWritable.set(session?.user ?? null);
    this.isAuthenticatedWritable.set(Boolean(session?.token));
  }
}
