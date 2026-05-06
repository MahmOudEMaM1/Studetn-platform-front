export type LoginRole = 'admin' | 'teacher' | 'student';

export interface LoginRequest {
  readonly username: string;
  readonly password: string;
  readonly deviceName: string;
  readonly role: LoginRole;
}

export interface AuthUser {
  readonly id: number;
  readonly username: string;
  readonly role: string;
  readonly full_name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly profile_image: string | null;
  readonly is_active: boolean;
  readonly profile_required: boolean;
  readonly profile_completed_at: string | null;
  readonly profile_completion_source: string | null;
  readonly profile_is_locked: boolean | null;
  readonly last_login_at: string | null;
  readonly created_by: number | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface LoginResponse {
  readonly token: string;
  readonly tokenType: string;
  readonly abilities: string[];
  readonly user: AuthUser;
}

export interface AuthSession {
  readonly token: string;
  readonly tokenType: string;
  readonly abilities: string[];
  readonly user: AuthUser | null;
}

export interface CurrentUserResponse {
  readonly data?: AuthUser | { readonly user?: AuthUser | null } | null;
  readonly user?: AuthUser | null;
}
