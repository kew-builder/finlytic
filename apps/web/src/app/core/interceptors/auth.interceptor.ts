import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap, catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/dev-login', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  // Public endpoints — pass through without touching tokens
  if (AUTH_ENDPOINTS.some(e => req.url.includes(e))) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.accessToken();

  if (!token) return next(req);

  // refresh if expired before attaching
  if (auth.isTokenExpired()) {
    const refresh$ = auth.refresh();
    if (!refresh$) {
      auth.logout();
      return throwError(() => new Error('Session expired'));
    }
    return refresh$.pipe(
      switchMap(() => next(addToken(req, auth.accessToken()!))),
      catchError(() => { auth.logout(); return throwError(() => new Error('Session expired')); })
    );
  }

  return next(addToken(req, token));
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
