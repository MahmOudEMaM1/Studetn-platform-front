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
    return this.http.post<LoginResponse>(this.appConfig.authLoginUrl, request);
  }

  getCurrentUser(): Observable<AuthUser> {
    return this.http
      .get<CurrentUserResponse>(this.appConfig.authMeUrl)
      .pipe(map((response) => this.extractCurrentUser(response)));
  }

  private extractCurrentUser(response: CurrentUserResponse): AuthUser {
    const directUser = response.user;
    const nestedUser = this.extractNestedUser(response.data);
    const user = directUser ?? nestedUser;

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

  private isAuthUser(value: unknown): value is AuthUser {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      'username' in value &&
      'role' in value
    );
  }
}
