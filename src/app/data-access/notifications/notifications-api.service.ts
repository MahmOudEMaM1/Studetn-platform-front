import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import { SKIP_APP_LOADING } from '../../core/interceptors/app-loading.interceptor';
import {
  AppNotification,
  NotificationActionResponse
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
      .get<unknown>(this.appConfig.notificationsUrl, {
        context: this.backgroundContext
      })
      .pipe(map((response) => this.extractArray(response).map((item) => this.mapNotification(item))));
  }

  getUnreadNotifications(): Observable<AppNotification[]> {
    return this.http
      .get<unknown>(this.appConfig.notificationsUnreadUrl, {
        context: this.backgroundContext
      })
      .pipe(map((response) => this.extractArray(response).map((item) => this.mapNotification(item))));
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
      .patch<NotificationActionResponse>(this.appConfig.notificationsReadAllUrl, {}, {
        context: this.backgroundContext
      })
      .pipe(map((response) => response.message?.trim() || 'All notifications marked as read.'));
  }

  mapNotification(item: unknown): AppNotification {
    const data = this.parseData(this.readString(item, 'data'));
    const readAt = this.readString(item, 'readAt', 'read_at');

    return {
      id: this.readString(item, 'id') ?? crypto.randomUUID(),
      type: this.readString(item, 'type') ?? 'notification',
      message:
        this.readString(data, 'message', 'Message') ??
        this.readString(item, 'message') ??
        'New notification',
      questionId: this.readNumber(data, 'questionId', 'QuestionId', 'question_id'),
      replyId: this.readNumber(data, 'replyId', 'ReplyId', 'reply_id'),
      readAt,
      createdAt: this.readString(item, 'createdAt', 'created_at') ?? '',
      isRead: this.readValue(item, 'isRead', 'is_read') === true || Boolean(readAt)
    };
  }

  private extractArray(response: unknown): unknown[] {
    const unwrapped = this.unwrapData(response);

    if (Array.isArray(unwrapped)) {
      return unwrapped;
    }

    return this.readArray(unwrapped, 'items');
  }

  private unwrapData(response: unknown): unknown {
    const record = this.asRecord(response);

    return record && record['data'] !== undefined && record['data'] !== null ? record['data'] : response;
  }

  private parseData(value: string | null): unknown {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private readValue(value: unknown, ...keys: string[]): unknown {
    const record = this.asRecord(value);

    if (!record) {
      return undefined;
    }

    for (const key of keys) {
      if (record[key] !== undefined) {
        return record[key];
      }
    }

    return undefined;
  }

  private readString(value: unknown, ...keys: string[]): string | null {
    const rawValue = keys.length > 0 ? this.readValue(value, ...keys) : value;

    return typeof rawValue === 'string' && rawValue.trim().length > 0 ? rawValue.trim() : null;
  }

  private readNumber(value: unknown, ...keys: string[]): number | null {
    const rawValue = this.readValue(value, ...keys);

    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return rawValue;
    }

    if (typeof rawValue === 'string') {
      const parsedValue = Number(rawValue);
      return Number.isFinite(parsedValue) ? parsedValue : null;
    }

    return null;
  }

  private readArray(value: unknown, ...keys: string[]): unknown[] {
    for (const key of keys) {
      const rawValue = this.readValue(value, key);

      if (Array.isArray(rawValue)) {
        return rawValue;
      }
    }

    return [];
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
  }
}
