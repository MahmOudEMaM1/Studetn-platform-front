import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppLoadingService } from './core/services/app-loading.service';
import { AuthSessionService } from './core/services/auth-session.service';
import { NotificationsCenterService } from './core/services/notifications-center.service';
import { appRouteLinks } from './core/routing/app-route-paths';
import { LoadingScreenComponent } from './core/ui/loading-screen/loading-screen.component';
import { AppNotification } from './data-access/notifications/notifications.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, LoadingScreenComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly appLoading = inject(AppLoadingService);
  private readonly authSession = inject(AuthSessionService);
  private readonly notificationsCenter = inject(NotificationsCenterService);
  private readonly currentUrl = signal(this.router.url);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isAppLoading = this.appLoading.isVisible;
  protected readonly isAuthenticated = this.authSession.isAuthenticated;
  protected readonly currentUser = this.authSession.currentUser;
  protected readonly notifications = this.notificationsCenter.items;
  protected readonly unreadNotifications = this.notificationsCenter.unreadItems;
  protected readonly isNotificationsOpen = this.notificationsCenter.isPanelOpen;
  protected readonly isNotificationsLoading = this.notificationsCenter.isLoading;
  protected readonly isMarkingAllNotifications = this.notificationsCenter.isMarkingAll;
  protected readonly shouldShowNotifications = computed(
    () => this.isAuthenticated() && !this.currentUrl().startsWith(appRouteLinks.login)
  );
  protected readonly shouldShowAppNav = this.shouldShowNotifications;
  protected readonly dashboardRoute = computed(() => this.authSession.getDashboardRoute());
  protected readonly activeUserName = computed(
    () => this.currentUser()?.full_name || this.currentUser()?.username || 'Active user'
  );
  protected readonly activeUserInitial = computed(() => this.activeUserName().charAt(0).toUpperCase());
  protected readonly navLinks = computed(() => {
    const role = this.authSession.getCurrentUserRole();
    const links = [
      {
        label: 'Dashboard',
        route: this.authSession.getDashboardRoute(role)
      },
      {
        label: 'Courses',
        route: appRouteLinks.courseContents
      },
      {
        label: 'AI Mentor',
        route: appRouteLinks.aiChat
      }
    ];

    if (role === 'student' || role === 'teacher') {
      links.splice(2, 0, {
        label: 'Community',
        route: appRouteLinks.studentCommunity
      });
    }

    return links;
  });

  constructor() {
    this.authSession.initialize();
    this.notificationsCenter.refresh();

    effect(() => {
      if (this.authSession.isAuthenticated()) {
        this.notificationsCenter.startRealtime();
      } else {
        this.notificationsCenter.stopRealtime();
      }
    });

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.currentUrl.set(event.url);
          this.closeMobileMenu();
          this.appLoading.startNavigation();
          return;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.currentUrl.set(event instanceof NavigationEnd ? event.urlAfterRedirects : this.router.url);
          this.appLoading.finishNavigation();

          if (event instanceof NavigationEnd && this.authSession.isAuthenticated()) {
            this.notificationsCenter.refresh();
          }
        }
      });
  }

  protected toggleNotifications(): void {
    this.closeMobileMenu();
    this.notificationsCenter.togglePanel();
  }

  protected closeNotifications(): void {
    this.notificationsCenter.closePanel();
  }

  protected markAllNotificationsAsRead(): void {
    this.notificationsCenter.markAllAsRead();
  }

  protected openNotification(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationsCenter.markAsRead(notification.id);
    }

    const targetRoute =
      notification.questionId !== null
        ? [appRouteLinks.studentCommunity]
        : [this.authSession.getDashboardRoute()];

    void this.router.navigate(targetRoute, {
      queryParams: notification.questionId ? { questionId: notification.questionId } : undefined
    });

    this.notificationsCenter.closePanel();
  }

  protected logout(): void {
    this.authSession.clear();
    this.notificationsCenter.stopRealtime();
    this.notificationsCenter.closePanel();
    this.closeMobileMenu();
    void this.router.navigate([appRouteLinks.login]);
  }

  protected toggleMobileMenu(): void {
    this.notificationsCenter.closePanel();
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected isExactNavLink(route: string): boolean {
    return route === this.dashboardRoute() || route === appRouteLinks.aiChat;
  }

  protected trackNotification(_index: number, notification: AppNotification): string {
    return notification.id;
  }
}
