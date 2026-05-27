import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RefreshRequest,
  RegisterRequest,
  Role,
  TokenResponse,
} from '../../models/auth.model';
import { Usuario } from '../../models/usuario.model';

const ACCESS_KEY = 'estoqueia.accessToken';
const REFRESH_KEY = 'estoqueia.refreshToken';

interface JwtPayload {
  sub: string;
  scope: string;
  iss: string;
  iat: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  private readonly _refreshToken = signal<string | null>(localStorage.getItem(REFRESH_KEY));
  private readonly _me = signal<Usuario | null>(null);

  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly me = this._me.asReadonly();
  readonly role = computed<Role | null>(() => {
    const token = this._accessToken();
    if (!token) return null;
    const payload = this.decode(token);
    return (payload?.scope as Role) ?? null;
  });
  readonly isAdmin = computed(() => this.role() === 'ADMIN');

  accessToken(): string | null {
    return this._accessToken();
  }

  refreshToken(): string | null {
    return this._refreshToken();
  }

  login(body: LoginRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/auth/login`, body)
      .pipe(tap((res) => this.storeTokens(res)));
  }

  register(body: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/register`, body);
  }

  refresh(): Observable<TokenResponse> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      throw new Error('Sem refresh token');
    }
    const body: RefreshRequest = { refreshToken };
    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/auth/refresh`, body)
      .pipe(tap((res) => this.storeTokens(res)));
  }

  loadMe(): Observable<Usuario> {
    return this.http
      .get<Usuario>(`${environment.apiUrl}/usuarios/me`)
      .pipe(tap((u) => this._me.set(u)));
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._me.set(null);
    this.router.navigateByUrl('/login');
  }

  private storeTokens(res: TokenResponse): void {
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    this._accessToken.set(res.accessToken);
    this._refreshToken.set(res.refreshToken);
  }

  private decode(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }
}
