import { Injectable } from '@angular/core';

import { appApiConfig } from '../config/app-api.config';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private readonly apiConfig = appApiConfig;

  get aiChatBaseUrl(): string {
    return this.apiConfig.aiChatBaseUrl;
  }

  get authBaseUrl(): string {
    return this.apiConfig.authBaseUrl;
  }

  get catalogBaseUrl(): string {
    return this.apiConfig.catalogBaseUrl;
  }

  get studentBaseUrl(): string {
    return this.apiConfig.studentBaseUrl;
  }

  get teacherBaseUrl(): string {
    return this.apiConfig.teacherBaseUrl;
  }

  get notificationsBaseUrl(): string {
    return this.apiConfig.notificationsBaseUrl;
  }

  get aiChatAskUrl(): string {
    return this.buildApiUrl(this.apiConfig.aiChatBaseUrl, this.apiConfig.aiChat.ask);
  }

  get authLoginUrl(): string {
    return this.buildApiUrl(this.apiConfig.authBaseUrl, this.apiConfig.auth.login);
  }

  get authMeUrl(): string {
    return this.buildApiUrl(this.apiConfig.authBaseUrl, this.apiConfig.auth.me);
  }

  get catalogTabsUrl(): string {
    return this.buildApiUrl(this.apiConfig.catalogBaseUrl, this.apiConfig.catalog.tabs);
  }

  catalogTabByIdUrl(tabId: string): string {
    return this.buildApiUrl(
      this.apiConfig.catalogBaseUrl,
      `${this.apiConfig.catalog.tabById}/${tabId}`
    );
  }

  catalogTopicByIdUrl(topicId: string): string {
    return this.buildApiUrl(
      this.apiConfig.catalogBaseUrl,
      `${this.apiConfig.catalog.topicById}/${topicId}`
    );
  }

  catalogTopicQuizByIdUrl(topicId: string): string {
    return this.buildApiUrl(
      this.apiConfig.catalogBaseUrl,
      `${this.apiConfig.catalog.topicQuizById}/${topicId}/quiz`
    );
  }

  get studentProgressUrl(): string {
    return this.buildApiUrl(this.apiConfig.studentBaseUrl, this.apiConfig.student.progress);
  }

  get studentQuizAttemptsChartUrl(): string {
    return this.buildApiUrl(
      this.apiConfig.studentBaseUrl,
      this.apiConfig.student.quizAttemptsChart
    );
  }

  get studentQuestionsUrl(): string {
    return this.buildApiUrl(this.apiConfig.studentBaseUrl, this.apiConfig.student.questions);
  }

  studentTopicQuizReviewUrl(topicId: string): string {
    return this.buildApiUrl(
      this.apiConfig.studentBaseUrl,
      `${this.apiConfig.student.topicQuizReviewById}/${topicId}/quiz/review`
    );
  }

  studentTopicQuizSubmitUrl(topicId: string): string {
    return this.buildApiUrl(
      this.apiConfig.studentBaseUrl,
      `${this.apiConfig.student.topicQuizSubmitById}/${topicId}/quiz/submit`
    );
  }

  get teacherDashboardUrl(): string {
    return this.buildApiUrl(this.apiConfig.teacherBaseUrl, this.apiConfig.teacher.dashboard);
  }

  get teacherStudentsUrl(): string {
    return this.buildApiUrl(this.apiConfig.teacherBaseUrl, this.apiConfig.teacher.students);
  }

  teacherStudentProgressUrl(studentId: string): string {
    return this.buildApiUrl(
      this.apiConfig.teacherBaseUrl,
      `${this.apiConfig.teacher.studentProgressById}/${studentId}/progress`
    );
  }

  teacherStudentTopicQuizAttemptsUrl(studentId: string, topicId: string): string {
    return this.buildApiUrl(
      this.apiConfig.teacherBaseUrl,
      `${this.apiConfig.teacher.studentTopicQuizAttemptsById}/${studentId}/topics/${topicId}/quiz-attempts`
    );
  }

  teacherQuizAttemptUrl(quizAttemptId: string): string {
    return this.buildApiUrl(
      this.apiConfig.teacherBaseUrl,
      `${this.apiConfig.teacher.quizAttemptById}/${quizAttemptId}`
    );
  }

  get teacherQuestionsUrl(): string {
    return this.buildApiUrl(this.apiConfig.teacherBaseUrl, this.apiConfig.teacher.questions);
  }

  teacherQuestionRepliesUrl(questionId: string): string {
    return this.buildApiUrl(
      this.apiConfig.teacherBaseUrl,
      `${this.apiConfig.teacher.questionRepliesById}/${questionId}/replies`
    );
  }

  get notificationsUrl(): string {
    return this.buildApiUrl(this.apiConfig.notificationsBaseUrl, this.apiConfig.notifications.list);
  }

  get notificationsUnreadUrl(): string {
    return this.buildApiUrl(
      this.apiConfig.notificationsBaseUrl,
      this.apiConfig.notifications.unread
    );
  }

  notificationReadUrl(notificationId: string): string {
    return this.buildApiUrl(
      this.apiConfig.notificationsBaseUrl,
      `${this.apiConfig.notifications.readByRef}/${notificationId}/read`
    );
  }

  get notificationsReadAllUrl(): string {
    return this.buildApiUrl(
      this.apiConfig.notificationsBaseUrl,
      this.apiConfig.notifications.readAll
    );
  }

  private buildApiUrl(baseUrl: string, path: string): string {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${normalizedBaseUrl}${normalizedPath}`;
  }
}
