import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AppConfigService } from '../services/app-config.service';
import { AuthSessionService } from '../services/auth-session.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authSession = inject(AuthSessionService);
  const appConfig = inject(AppConfigService);
  const authorizationHeader = authSession.getAuthorizationHeader();
  const shouldAttachToken =
    request.url.startsWith(appConfig.authBaseUrl) ||
    request.url.startsWith(appConfig.catalogBaseUrl) ||
    request.url.startsWith(appConfig.studentBaseUrl) ||
    request.url.startsWith(appConfig.teacherBaseUrl) ||
    request.url.startsWith(appConfig.notificationsBaseUrl);

  const isBackendProxyRequest = request.url.startsWith('/backend-api');

  if (!authorizationHeader) {
    console.log('[auth-token-interceptor] forwarding request without extra headers', {
      url: request.url,
      method: request.method
    });

    return next(request);
  }

  const setHeaders: Record<string, string> = {};

  if (authorizationHeader && (shouldAttachToken || isBackendProxyRequest)) {
    setHeaders['Authorization'] = authorizationHeader;
  }

  console.log('[auth-token-interceptor] attaching headers', {
    url: request.url,
    method: request.method,
    headers: setHeaders
  });

  return next(
    request.clone({
      setHeaders
    })
  );
};
