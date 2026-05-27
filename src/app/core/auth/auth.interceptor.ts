import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

function isApi(req: HttpRequest<unknown>): boolean {
  return req.url.startsWith(environment.apiUrl);
}

function withAuth<T>(req: HttpRequest<T>, token: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!isApi(req) || PUBLIC_PATHS.some((p) => req.url.includes(p))) {
    return next(req);
  }

  const token = auth.accessToken();
  const authed = token ? withAuth(req, token) : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        auth.refreshToken() &&
        !req.url.includes('/auth/refresh')
      ) {
        return auth.refresh().pipe(
          switchMap((res) => next(withAuth(req, res.accessToken))),
          catchError((refreshErr) => {
            auth.logout();
            return throwError(() => refreshErr);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
