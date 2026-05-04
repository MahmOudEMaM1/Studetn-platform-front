import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { appLoadingInterceptor } from './core/interceptors/app-loading.interceptor';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([appLoadingInterceptor, authTokenInterceptor])),
    provideRouter(routes)
  ]
};
