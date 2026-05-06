import { inject, Injectable, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState
} from '@microsoft/signalr';
import { catchError, EMPTY, finalize, forkJoin, tap } from 'rxjs';

import { AuthSessionService } from './auth-session.service';
import { AppConfigService } from './app-config.service';
import { AppNotification } from '../../data-access/notifications/notifications.models';
import { NotificationsApiService } from '../../data-access/notifications/notifications-api.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsCenterService {
  private readonly authSession = inject(AuthSessionService);
  private readonly appConfig = inject(AppConfigService);
  private readonly notificationsApi = inject(NotificationsApiService);
  private hubConnection: HubConnection | null = null;
  private isStartingConnection = false;

  private readonly itemsWritable = signal<AppNotification[]>([]);
  private readonly unreadItemsWritable = signal<AppNotification[]>([]);
  private readonly isPanelOpenWritable = signal(false);
  private readonly isLoadingWritable = signal(false);
  private readonly isMarkingAllWritable = signal(false);
  private readonly latestRealtimeNotificationWritable = signal<AppNotification | null>(null);

  readonly items = this.itemsWritable.asReadonly();
  readonly unreadItems = this.unreadItemsWritable.asReadonly();
  readonly isPanelOpen = this.isPanelOpenWritable.asReadonly();
  readonly isLoading = this.isLoadingWritable.asReadonly();
  readonly isMarkingAll = this.isMarkingAllWritable.asReadonly();
  readonly latestRealtimeNotification = this.latestRealtimeNotificationWritable.asReadonly();

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

  startRealtime(): void {
    if (
      !this.authSession.isAuthenticated() ||
      this.isStartingConnection ||
      this.hubConnection?.state === HubConnectionState.Connected ||
      this.hubConnection?.state === HubConnectionState.Connecting
    ) {
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.appConfig.notificationsHubUrl, {
        accessTokenFactory: () => this.authSession.currentSession()?.token ?? ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (payload: unknown) => {
      this.receiveNotification(this.notificationsApi.mapNotification(payload));
    });

    this.isStartingConnection = true;

    void this.hubConnection
      .start()
      .then(() => this.refresh())
      .catch(() => {
        this.hubConnection = null;
      })
      .finally(() => {
        this.isStartingConnection = false;
      });
  }

  stopRealtime(): void {
    const connection = this.hubConnection;
    this.hubConnection = null;
    this.isStartingConnection = false;

    connection?.off('ReceiveNotification');

    if (connection?.state !== HubConnectionState.Disconnected) {
      void connection?.stop();
    }
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

  private receiveNotification(notification: AppNotification): void {
    this.latestRealtimeNotificationWritable.set(notification);

    this.itemsWritable.update((items) => {
      const existingIndex = items.findIndex((item) => item.id === notification.id);

      if (existingIndex === -1) {
        return [notification, ...items];
      }

      const nextItems = [...items];
      nextItems[existingIndex] = notification;

      return nextItems;
    });

    if (!notification.isRead) {
      this.unreadItemsWritable.update((items) => {
        const existingIndex = items.findIndex((item) => item.id === notification.id);

        if (existingIndex === -1) {
          return [notification, ...items];
        }

        const nextItems = [...items];
        nextItems[existingIndex] = notification;

        return nextItems;
      });
    }
  }
}
