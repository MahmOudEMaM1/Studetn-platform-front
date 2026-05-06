import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import {
  AuthUser,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse
} from './auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<unknown>(this.appConfig.authLoginUrl, request)
      .pipe(map((response) => this.mapLoginResponse(response)));
  }

  getCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<CurrentUserResponse | AuthUser>(this.appConfig.authMeUrl)
      .pipe(map((response) => this.extractCurrentUser(response)));
  }

  private mapLoginResponse(response: unknown): LoginResponse {
    const payload = this.asRecord(response);
    const data = this.asRecord(payload?.['data']);
    const user = this.normalizeUser(payload?.['user'] ?? data?.['user']);
    const token = this.pickString(payload?.['token'], data?.['token']);
    const tokenType = this.pickString(payload?.['tokenType'], payload?.['token_type'], data?.['tokenType'], data?.['token_type']) ?? 'Bearer';
    const abilities = Array.isArray(data?.['abilities']) ? data['abilities'].filter((item): item is string => typeof item === 'string') : [];

    if (!token || !user) {
      throw new Error('Login response is missing token or user payload.');
    }

    return {
      token,
      tokenType,
      abilities,
      user
    };
  }

  private extractCurrentUser(response: CurrentUserResponse | AuthUser): AuthUser {
    const payload = this.asRecord(response);
    const directUser = payload?.['user'];
    const nestedUser = this.extractNestedUser(payload?.['data'] as CurrentUserResponse['data']);
    const user = this.normalizeUser(directUser ?? nestedUser ?? response);

    if (!this.isAuthUser(user)) {
      throw new Error('Authenticated user payload is missing from /me response.');
    }

    return user;
  }

  private extractNestedUser(
    data: CurrentUserResponse['data']
  ): AuthUser | null {
    if (!data) {
      return null;
    }

    if ('user' in data) {
      return this.isAuthUser(data.user) ? data.user : null;
    }

    return this.isAuthUser(data) ? data : null;
  }

  private normalizeUser(value: unknown): AuthUser | null {
    const user = this.asRecord(value);

    if (!user || !('id' in user) || !('username' in user) || !('role' in user)) {
      return null;
    }

    return {
      id: Number(user['id'] ?? 0),
      username: this.pickString(user['username']) ?? '',
      role: this.pickString(user['role']) ?? '',
      full_name: this.pickString(user['full_name'], user['fullName']),
      email: this.pickString(user['email']),
      phone: this.pickString(user['phone']),
      profile_image: this.pickString(user['profile_image'], user['profileImage']),
      is_active: Boolean(user['is_active'] ?? user['isActive'] ?? true),
      profile_required: Boolean(user['profile_required'] ?? false),
      profile_completed_at: this.pickString(user['profile_completed_at'], user['profileCompletedAt']),
      profile_completion_source: this.pickString(user['profile_completion_source'], user['profileCompletionSource']),
      profile_is_locked: this.pickBoolean(user['profile_is_locked'], user['profileCompleted']),
      last_login_at: this.pickString(user['last_login_at'], user['lastLoginAt']),
      created_by: this.pickNumber(user['created_by'], user['createdBy']),
      created_at: this.pickString(user['created_at'], user['createdAt']) ?? '',
      updated_at: this.pickString(user['updated_at'], user['updatedAt']) ?? ''
    };
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

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  }

  private pickString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    return null;
  }

  private pickNumber(...values: unknown[]): number | null {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
    }

    return null;
  }

  private pickBoolean(...values: unknown[]): boolean | null {
    for (const value of values) {
      if (typeof value === 'boolean') {
        return value;
      }
    }

    return null;
  }
}
