export interface NotificationApiItem {
  readonly id?: string | null;
  readonly type?: string | null;
  readonly message?: string | null;
  readonly question_id?: number | null;
  readonly reply_id?: number | null;
  readonly read_at?: string | null;
  readonly created_at?: string | null;
}

export interface NotificationsResponse {
  readonly data?: NotificationApiItem[] | null;
}

export interface NotificationActionResponse {
  readonly message?: string | null;
}

export interface AppNotification {
  readonly id: string;
  readonly type: string;
  readonly message: string;
  readonly questionId: number | null;
  readonly replyId: number | null;
  readonly readAt: string | null;
  readonly createdAt: string;
  readonly isRead: boolean;
}
