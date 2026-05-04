import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import {
  StudentProgress,
  StudentProgressResponse,
  StudentQuizAttemptChartApiItem,
  StudentQuizAttemptChartItem,
  StudentQuizAttemptsChartResponse
} from './student-progress.models';

@Injectable({
  providedIn: 'root'
})
export class StudentProgressApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getProgress(): Observable<StudentProgress> {
    return this.http
      .get<StudentProgressResponse>(this.appConfig.studentProgressUrl)
      .pipe(map((response) => this.mapProgress(response.data)));
  }

  getQuizAttemptsChart(): Observable<StudentQuizAttemptChartItem[]> {
    return this.http
      .get<StudentQuizAttemptsChartResponse>(this.appConfig.studentQuizAttemptsChartUrl)
      .pipe(
        map((response) =>
          (response.data ?? [])
            .map((item, index) => this.mapQuizAttemptChartItem(item, index))
            .sort((firstItem, secondItem) => firstItem.attemptOrder - secondItem.attemptOrder)
        )
      );
  }

  private mapProgress(data: StudentProgressResponse['data']): StudentProgress {
    return {
      completedQuizzes: data?.completed_quizzes ?? 0,
      attemptsCount: data?.attempts_count ?? 0,
      averageScore: data?.average_score ?? 0,
      bestScore: data?.best_score ?? 0,
      passedQuizzesCount: data?.passed_quizzes_count ?? 0,
      failedQuizzesCount: data?.failed_quizzes_count ?? 0
    };
  }

  private mapQuizAttemptChartItem(
    item: StudentQuizAttemptChartApiItem,
    index: number
  ): StudentQuizAttemptChartItem {
    return {
      attemptOrder: item?.attempt_order ?? index + 1,
      quizAttemptId: item?.quiz_attempt_id ?? index + 1,
      topicId: item?.topic_id ?? 0,
      topicName: item?.topic_name?.trim() || `Topic ${item?.topic_id ?? index + 1}`,
      scorePercentage: item?.score_percentage ?? 0,
      passed: item?.passed === true,
      submittedAt: item?.submitted_at?.trim() || ''
    };
  }
}
