import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import {
  StudentProgress,
  StudentQuizAttemptChartItem
} from './student-progress.models';

@Injectable({
  providedIn: 'root'
})
export class StudentProgressApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getProgress(): Observable<StudentProgress> {
    return this.http
      .get<unknown>(this.appConfig.studentProgressUrl)
      .pipe(map((response) => this.mapProgress(this.unwrapData(response))));
  }

  getQuizAttemptsChart(): Observable<StudentQuizAttemptChartItem[]> {
    return this.http
      .get<unknown>(this.appConfig.studentProgressUrl)
      .pipe(
        map((response) =>
          this.readArray(this.unwrapData(response), 'topics')
            .map((item, index) => this.mapTopicProgressChartItem(item, index))
            .sort((firstItem, secondItem) => firstItem.attemptOrder - secondItem.attemptOrder)
        )
      );
  }

  private mapProgress(data: unknown): StudentProgress {
    const topics = this.readArray(data, 'topics');
    const bestScore = topics.reduce<number>(
      (maxScore, topic) => Math.max(maxScore, this.readNumber(topic, 'bestScore', 'best_score') ?? 0),
      0
    );

    return {
      completedQuizzes: this.readNumber(data, 'completedTopics', 'completed_topics', 'completed_quizzes') ?? 0,
      attemptsCount: this.readNumber(data, 'totalAttempts', 'total_attempts', 'attempts_count') ?? 0,
      averageScore: this.readNumber(data, 'averageScore', 'average_score') ?? 0,
      bestScore,
      passedQuizzesCount: this.readNumber(data, 'passedAttempts', 'passed_attempts', 'passed_quizzes_count') ?? 0,
      failedQuizzesCount: this.readNumber(data, 'failedAttempts', 'failed_attempts', 'failed_quizzes_count') ?? 0
    };
  }

  private mapTopicProgressChartItem(item: unknown, index: number): StudentQuizAttemptChartItem {
    const bestScore = this.readNumber(item, 'bestScore', 'best_score') ?? 0;

    return {
      attemptOrder: index + 1,
      quizAttemptId: index + 1,
      topicId: this.readNumber(item, 'topicId', 'topic_id') ?? 0,
      topicName: this.readString(item, 'topicName', 'topic_name') ?? `Topic ${index + 1}`,
      scorePercentage: bestScore,
      passed: this.readValue(item, 'passed') === true,
      submittedAt: ''
    };
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
