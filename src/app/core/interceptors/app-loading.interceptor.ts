import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { AppLoadingService } from '../services/app-loading.service';

export const SKIP_APP_LOADING = new HttpContextToken<boolean>(() => false);

export const appLoadingInterceptor: HttpInterceptorFn = (request, next) => {
  const appLoading = inject(AppLoadingService);

  if (request.context.get(SKIP_APP_LOADING)) {
    return next(request);
  }

  appLoading.startHttpRequest();

  return next(request).pipe(finalize(() => appLoading.finishHttpRequest()));
};
