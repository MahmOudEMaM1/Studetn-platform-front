import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import { LoginRole } from '../auth/auth.models';
import {
  CommunityQuestion,
  CommunityReply,
  CreateReplyRequest,
  CreateStudentQuestionRequest,
} from './community.models';

@Injectable({
  providedIn: 'root'
})
export class CommunityApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getQuestions(role: Extract<LoginRole, 'student' | 'teacher'>): Observable<CommunityQuestion[]> {
    const request$ =
      role === 'teacher'
        ? this.http.get<unknown>(this.appConfig.teacherQuestionsUrl)
        : this.http.get<unknown>(this.appConfig.studentQuestionsUrl);

    return request$.pipe(
      map((response) =>
        this.extractArray(response)
          .map((question) => this.mapQuestion(question))
          .sort((firstQuestion, secondQuestion) => secondQuestion.id - firstQuestion.id)
      )
    );
  }

  createStudentQuestion(question: string): Observable<CommunityQuestion> {
    const payload: CreateStudentQuestionRequest = { question };

    return this.http
      .post<unknown>(this.appConfig.studentQuestionsUrl, payload)
      .pipe(map((response) => this.mapQuestion(this.unwrapData(response))));
  }

  createReply(
    role: Extract<LoginRole, 'student' | 'teacher'>,
    questionId: number,
    reply: string
  ): Observable<CommunityReply> {
    const payload: CreateReplyRequest = { reply };
    const url =
      role === 'teacher'
        ? this.appConfig.teacherQuestionRepliesUrl(String(questionId))
        : this.appConfig.studentQuestionRepliesUrl(String(questionId));

    return this.http
      .post<unknown>(url, payload)
      .pipe(map((response) => this.mapReply(this.unwrapData(response))));
  }

  private mapQuestion(item: unknown): CommunityQuestion {
    const replies = this.readArray(item, 'replies').map((reply) => this.mapReply(reply));

    return {
      id: this.readNumber(item, 'id') ?? 0,
      question: this.readString(item, 'question') ?? 'Untitled question',
      isVisible: this.readValue(item, 'isVisible', 'is_visible') === true || this.readValue(item, 'isVisible', 'is_visible') === 1,
      studentId: this.readNumber(this.readValue(item, 'student'), 'id') ?? 0,
      studentName: this.readString(this.readValue(item, 'student'), 'fullName', 'full_name') ?? 'Student',
      replies,
      createdAt: this.readString(item, 'createdAt', 'created_at') ?? '',
      solved: replies.length > 0
    };
  }

  private mapReply(item: unknown): CommunityReply {
    return {
      id: this.readNumber(item, 'id') ?? 0,
      reply: this.readString(item, 'reply') ?? '',
      authorId: this.readNumber(this.readValue(item, 'author'), 'id') ?? this.readNumber(this.readValue(item, 'teacher'), 'id') ?? 0,
      authorName:
        this.readString(item, 'authorName', 'author_name') ??
        this.readString(item, 'teacherName', 'teacher_name') ??
        this.readString(this.readValue(item, 'teacher'), 'fullName', 'full_name') ??
        'Community member',
      authorRole: this.normalizeRole(this.readString(item, 'authorRole', 'author_role')),
      createdAt: this.readString(item, 'createdAt', 'created_at') ?? ''
    };
  }

  private normalizeRole(value: string | null): LoginRole | 'community' {
    return value === 'student' || value === 'teacher' || value === 'admin' ? value : 'community';
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
    const rawValue = this.readValue(value, ...keys);

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
