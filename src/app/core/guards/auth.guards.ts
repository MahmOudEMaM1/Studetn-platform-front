import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';

import { appRouteLinks } from '../routing/app-route-paths';
import { AuthSessionService } from '../services/auth-session.service';
import { LoginRole } from '../../data-access/auth/auth.models';

function redirectToLogin(router: Router): UrlTree {
  return router.createUrlTree([appRouteLinks.login]);
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authSession = inject(AuthSessionService);

  return authSession.isAuthenticated() ? true : redirectToLogin(router);
};

export function roleGuard(...allowedRoles: LoginRole[]): CanActivateFn {
  return () => {
    const router = inject(Router);
    const authSession = inject(AuthSessionService);

    if (!authSession.isAuthenticated()) {
      return redirectToLogin(router);
    }

    const userRole = authSession.getCurrentUserRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    return router.createUrlTree([authSession.getDashboardRoute(userRole)]);
  };
}

export const dashboardRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authSession = inject(AuthSessionService);

  if (!authSession.isAuthenticated()) {
    return redirectToLogin(router);
  }

  return router.createUrlTree([authSession.getDashboardRoute()]);
};
