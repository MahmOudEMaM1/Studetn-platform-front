import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import { SKIP_APP_LOADING } from '../../core/interceptors/app-loading.interceptor';
import {
  AppNotification,
  NotificationActionResponse,
  NotificationApiItem,
  NotificationsResponse
} from './notifications.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationsApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);
  private readonly backgroundContext = new HttpContext().set(SKIP_APP_LOADING, true);

  getNotifications(): Observable<AppNotification[]> {
    return this.http
      .get<NotificationsResponse>(this.appConfig.notificationsUrl, {
        context: this.backgroundContext
      })
      .pipe(map((response) => (response.data ?? []).map((item) => this.mapNotification(item))));
  }

  getUnreadNotifications(): Observable<AppNotification[]> {
    return this.http
      .get<NotificationsResponse>(this.appConfig.notificationsUnreadUrl, {
        context: this.backgroundContext
      })
      .pipe(map((response) => (response.data ?? []).map((item) => this.mapNotification(item))));
  }

  markAsRead(notificationId: string): Observable<string> {
    return this.http
      .patch<NotificationActionResponse>(this.appConfig.notificationReadUrl(notificationId), {}, {
        context: this.backgroundContext
      })
      .pipe(map((response) => response.message?.trim() || 'Notification marked as read.'));
  }

  markAllAsRead(): Observable<string> {
    return this.http
      .get<NotificationActionResponse>(this.appConfig.notificationsReadAllUrl, {
        context: this.backgroundContext
      })
      .pipe(map((response) => response.message?.trim() || 'All notifications marked as read.'));
  }

  private mapNotification(item: NotificationApiItem): AppNotification {
    return {
      id: item?.id?.trim() || crypto.randomUUID(),
      type: item?.type?.trim() || 'notification',
      message: item?.message?.trim() || 'New notification',
      questionId: item?.question_id ?? null,
      replyId: item?.reply_id ?? null,
      readAt: item?.read_at?.trim() || null,
      createdAt: item?.created_at?.trim() || '',
      isRead: Boolean(item?.read_at)
    };
  }
}
