import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private _accessToken = signal<string | null>(localStorage.getItem('access_token'));
  private _user = signal<UserInfo | null>(this.loadUser());

  readonly isLoggedIn = computed(() => !!this._accessToken());
  readonly currentUser = computed(() => this._user());
  readonly accessToken = computed(() => this._accessToken());

  constructor(private http: HttpClient, private router: Router) {}

  register(email: string, password: string, name: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, { email, password, name }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  refresh() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(res => this.saveSession(res))
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    localStorage.removeItem('user');
    this._accessToken.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    return new Date(expiresAt) <= new Date();
  }

  private saveSession(res: AuthResponse) {
    localStorage.setItem('access_token', res.accessToken);
    localStorage.setItem('refresh_token', res.refreshToken);
    localStorage.setItem('token_expires_at', res.expiresAt);

    // decode name/email from JWT payload
    const payload = JSON.parse(atob(res.accessToken.split('.')[1]));
    const user: UserInfo = { id: payload.sub, email: payload.email, name: payload.name };
    localStorage.setItem('user', JSON.stringify(user));
    this._accessToken.set(res.accessToken);
    this._user.set(user);
  }

  private loadUser(): UserInfo | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}
