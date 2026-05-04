import { inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, forkJoin, interval, Subscription, switchMap, tap } from 'rxjs';

import { AuthSessionService } from './auth-session.service';
import { AppNotification } from '../../data-access/notifications/notifications.models';
import { NotificationsApiService } from '../../data-access/notifications/notifications-api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsCenterService {
  private static readonly POLLING_INTERVAL_MS = 10_000;

  private readonly authSession = inject(AuthSessionService);
  private readonly notificationsApi = inject(NotificationsApiService);
  private pollingSubscription: Subscription | null = null;

  private readonly itemsWritable = signal<AppNotification[]>([]);
  private readonly unreadItemsWritable = signal<AppNotification[]>([]);
  private readonly isPanelOpenWritable = signal(false);
  private readonly isLoadingWritable = signal(false);
  private readonly isMarkingAllWritable = signal(false);

  readonly items = this.itemsWritable.asReadonly();
  readonly unreadItems = this.unreadItemsWritable.asReadonly();
  readonly isPanelOpen = this.isPanelOpenWritable.asReadonly();
  readonly isLoading = this.isLoadingWritable.asReadonly();
  readonly isMarkingAll = this.isMarkingAllWritable.asReadonly();

  refresh(): void {
    if (!this.authSession.isAuthenticated()) {
      this.itemsWritable.set([]);
      this.unreadItemsWritable.set([]);
      return;
    }

    this.isLoadingWritable.set(true);

    forkJoin({
      all: this.notificationsApi.getNotifications(),
      unread: this.notificationsApi.getUnreadNotifications()
    })
      .pipe(
        tap(({ all, unread }) => {
          this.itemsWritable.set(all);
          this.unreadItemsWritable.set(unread);
        }),
        catchError(() => EMPTY),
        finalize(() => this.isLoadingWritable.set(false))
      )
      .subscribe();
  }

  startPolling(): void {
    if (this.pollingSubscription || !this.authSession.isAuthenticated()) {
      return;
    }

    this.pollingSubscription = interval(NotificationsCenterService.POLLING_INTERVAL_MS)
      .pipe(
        switchMap(() => this.notificationsApi.getUnreadNotifications()),
        tap((unreadItems) => {
          this.unreadItemsWritable.set(unreadItems);

          this.itemsWritable.update((items) => {
            if (this.isPanelOpenWritable()) {
              return items;
            }

            const unreadById = new Map(unreadItems.map((item) => [item.id, item]));
            const nextItems = items.map((item) => unreadById.get(item.id) ?? { ...item, isRead: true });
            const unseenItems = unreadItems.filter(
              (unreadItem) => !nextItems.some((existingItem) => existingItem.id === unreadItem.id)
            );

            return [...unseenItems, ...nextItems];
          });
        }),
        catchError(() => EMPTY)
      )
      .subscribe();
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  togglePanel(): void {
    const nextValue = !this.isPanelOpenWritable();
    this.isPanelOpenWritable.set(nextValue);

    if (nextValue) {
      this.refresh();
    }
  }

  closePanel(): void {
    this.isPanelOpenWritable.set(false);
  }

  markAsRead(notificationId: string): void {
    this.notificationsApi
      .markAsRead(notificationId)
      .pipe(
        tap(() => {
          this.itemsWritable.update((items) =>
            items.map((item) =>
              item.id === notificationId
                ? {
                    ...item,
                    readAt: new Date().toISOString(),
                    isRead: true
                  }
                : item
            )
          );
          this.unreadItemsWritable.update((items) => items.filter((item) => item.id !== notificationId));
        }),
        catchError(() => EMPTY)
      )
      .subscribe();
  }

  markAllAsRead(): void {
    if (this.unreadItemsWritable().length === 0 || this.isMarkingAllWritable()) {
      return;
    }

    this.isMarkingAllWritable.set(true);

    this.notificationsApi
      .markAllAsRead()
      .pipe(
        tap(() => {
          const timestamp = new Date().toISOString();

          this.itemsWritable.update((items) =>
            items.map((item) => ({
              ...item,
              readAt: item.readAt || timestamp,
              isRead: true
            }))
          );
          this.unreadItemsWritable.set([]);
        }),
        catchError(() => EMPTY),
        finalize(() => this.isMarkingAllWritable.set(false))
      )
      .subscribe();
  }
}
