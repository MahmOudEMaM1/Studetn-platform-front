import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AppConfigService } from '../../core/services/app-config.service';
import {
  TeacherDashboardResponse,
  TeacherDashboardStudentSummary,
  TeacherDashboardSummary,
  TeacherDashboardTopStudentApiItem,
  TeacherDashboardWeakStudentApiItem,
  TeacherDashboardWeakTopic,
  TeacherDashboardWeakTopicApiItem,
  TeacherQuizAttemptAnswer,
  TeacherQuizAttemptAnswerApiItem,
  TeacherQuizAttemptDetail,
  TeacherQuizAttemptDetailResponse,
  TeacherQuizAttemptListItem,
  TeacherQuizAttemptSummaryApiItem,
  TeacherStudentIdentity,
  TeacherStudentIdentityApiItem,
  TeacherStudentListItem,
  TeacherStudentProgress,
  TeacherStudentProgressResponse,
  TeacherStudentProgressSummary,
  TeacherStudentProgressSummaryApiItem,
  TeacherStudentsResponse,
  TeacherStudentTopicProgress,
  TeacherStudentTopicProgressApiItem,
  TeacherStudentTopicQuizAttempts,
  TeacherStudentTopicQuizAttemptsResponse
} from './teacher-dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class TeacherDashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(AppConfigService);

  getDashboard(): Observable<TeacherDashboardSummary> {
    return this.http
      .get<TeacherDashboardResponse>(this.appConfig.teacherDashboardUrl)
      .pipe(map((response) => this.mapDashboard(response.data)));
  }

  getStudents(): Observable<TeacherStudentListItem[]> {
    return this.http.get<TeacherStudentsResponse>(this.appConfig.teacherStudentsUrl).pipe(
      map((response) =>
        (response.data ?? []).map((item) => ({
          studentId: item?.id ?? 0,
          userId: item?.user_id ?? 0,
          fullName: item?.full_name?.trim() || 'Student',
          email: item?.email?.trim() || 'No email provided',
          phone: item?.phone?.trim() || 'No phone provided',
          attemptsCount: item?.attempts_count ?? 0,
          completedQuizzes: item?.completed_quizzes ?? 0,
          averageScore: item?.average_score ?? 0,
          bestScore: item?.best_score ?? 0
        }))
      )
    );
  }

  getStudentProgress(studentId: number): Observable<TeacherStudentProgress> {
    return this.http
      .get<TeacherStudentProgressResponse>(
        this.appConfig.teacherStudentProgressUrl(String(studentId))
      )
      .pipe(map((response) => this.mapStudentProgress(response.data)));
  }

  getStudentTopicQuizAttempts(
    studentId: number,
    topicId: number
  ): Observable<TeacherStudentTopicQuizAttempts> {
    return this.http
      .get<TeacherStudentTopicQuizAttemptsResponse>(
        this.appConfig.teacherStudentTopicQuizAttemptsUrl(String(studentId), String(topicId))
      )
      .pipe(map((response) => this.mapTopicQuizAttempts(response.data)));
  }

  getQuizAttempt(quizAttemptId: number): Observable<TeacherQuizAttemptDetail> {
    return this.http
      .get<TeacherQuizAttemptDetailResponse>(
        this.appConfig.teacherQuizAttemptUrl(String(quizAttemptId))
      )
      .pipe(map((response) => this.mapQuizAttemptDetail(response.data)));
  }

  private mapDashboard(data: TeacherDashboardResponse['data']): TeacherDashboardSummary {
    return {
      studentsCount: data?.students_count ?? 0,
      studentsWithAttemptsCount: data?.students_with_attempts_count ?? 0,
      totalAttemptsCount: data?.total_attempts_count ?? 0,
      averageScore: data?.average_score ?? 0,
      passedAttemptsCount: data?.passed_attempts_count ?? 0,
      failedAttemptsCount: data?.failed_attempts_count ?? 0,
      weakStudents: (data?.weak_students ?? []).map((item) => this.mapWeakStudent(item)),
      topStudents: (data?.top_students ?? []).map((item) => this.mapTopStudent(item)),
      weakTopics: (data?.weak_topics ?? []).map((item) => this.mapWeakTopic(item))
    };
  }

  private mapWeakStudent(
    item: TeacherDashboardWeakStudentApiItem
  ): TeacherDashboardStudentSummary {
    return {
      studentId: item?.student_id ?? 0,
      userId: item?.user_id ?? 0,
      fullName: item?.full_name?.trim() || 'Student',
      email: item?.email?.trim() || 'No email provided',
      averageScore: item?.average_score ?? 0,
      attemptsCount: item?.attempts_count ?? 0
    };
  }

  private mapTopStudent(item: TeacherDashboardTopStudentApiItem): TeacherDashboardStudentSummary {
    return {
      studentId: item?.student_id ?? 0,
      userId: item?.user_id ?? 0,
      fullName: item?.full_name?.trim() || 'Student',
      email: item?.email?.trim() || 'No email provided',
      averageScore: item?.average_score ?? 0,
      bestScore: item?.best_score ?? 0,
      attemptsCount: item?.attempts_count ?? 0
    };
  }

  private mapWeakTopic(item: TeacherDashboardWeakTopicApiItem): TeacherDashboardWeakTopic {
    return {
      topicId: item?.topic_id ?? 0,
      topicName: item?.topic_name?.trim() || 'Topic',
      averageScore: item?.average_score ?? 0,
      attemptsCount: item?.attempts_count ?? 0,
      failedAttemptsCount: item?.failed_attempts_count ?? 0
    };
  }

  private mapStudentProgress(
    data: TeacherStudentProgressResponse['data']
  ): TeacherStudentProgress {
    return {
      student: this.mapStudentIdentity(data?.student),
      summary: this.mapStudentProgressSummary(data?.summary),
      topics: (data?.topics ?? [])
        .map((topic) => this.mapStudentTopicProgress(topic))
        .sort((firstTopic, secondTopic) => firstTopic.topicName.localeCompare(secondTopic.topicName))
    };
  }

  private mapTopicQuizAttempts(
    data: TeacherStudentTopicQuizAttemptsResponse['data']
  ): TeacherStudentTopicQuizAttempts {
    const topicId = data?.topic?.id ?? 0;
    const topicName = data?.topic?.name?.trim() || 'Topic';

    return {
      student: this.mapStudentIdentity(data?.student),
      topic: {
        topicId,
        topicName
      },
      attempts: (data?.attempts ?? [])
        .map((attempt) => this.mapQuizAttempt(attempt, topicId, topicName))
        .sort(
          (firstAttempt, secondAttempt) =>
            new Date(firstAttempt.submittedAt).getTime() -
            new Date(secondAttempt.submittedAt).getTime()
        )
    };
  }

  private mapQuizAttemptDetail(
    data: TeacherQuizAttemptDetailResponse['data']
  ): TeacherQuizAttemptDetail {
    const topicId = data?.topic?.id ?? 0;
    const topicName = data?.topic?.name?.trim() || 'Topic';
    const summary = data?.summary;

    return {
      attemptId: data?.id ?? 0,
      student: this.mapStudentIdentity(data?.student),
      topic: {
        topicId,
        topicName
      },
      summary: this.mapQuizAttemptSummary(data?.id ?? 0, topicId, topicName, summary),
      answers: (data?.answers ?? []).map((answer) => this.mapQuizAttemptAnswer(answer))
    };
  }

  private mapStudentIdentity(item?: TeacherStudentIdentityApiItem | null): TeacherStudentIdentity {
    return {
      studentId: item?.id ?? 0,
      userId: item?.user_id ?? 0,
      fullName: item?.full_name?.trim() || 'Student',
      email: item?.email?.trim() || 'No email provided',
      phone: item?.phone?.trim() || 'No phone provided'
    };
  }

  private mapStudentProgressSummary(
    item?: TeacherStudentProgressSummaryApiItem | null
  ): TeacherStudentProgressSummary {
    return {
      completedQuizzes: item?.completed_quizzes ?? 0,
      attemptsCount: item?.attempts_count ?? 0,
      averageScore: item?.average_score ?? 0,
      bestScore: item?.best_score ?? 0,
      passedQuizzesCount: item?.passed_quizzes_count ?? 0,
      failedQuizzesCount: item?.failed_quizzes_count ?? 0
    };
  }

  private mapStudentTopicProgress(
    item: TeacherStudentTopicProgressApiItem
  ): TeacherStudentTopicProgress {
    return {
      topicId: item?.topic_id ?? 0,
      topicName: item?.topic_name?.trim() || 'Topic',
      attemptsCount: item?.attempts_count ?? 0,
      latestScore: item?.latest_score ?? 0,
      bestScore: item?.best_score ?? 0,
      averageScore: item?.average_score ?? 0,
      isImproving: item?.is_improving === true
    };
  }

  private mapQuizAttempt(
    item: {
      readonly id?: number | null;
      readonly topic?: { readonly id?: number | null; readonly name?: string | null } | null;
      readonly total_questions?: number | null;
      readonly correct_answers_count?: number | null;
      readonly wrong_answers_count?: number | null;
      readonly score_percentage?: number | string | null;
      readonly passed?: boolean | null;
      readonly started_at?: string | null;
      readonly submitted_at?: string | null;
    },
    fallbackTopicId: number,
    fallbackTopicName: string
  ): TeacherQuizAttemptListItem {
    return {
      attemptId: item?.id ?? 0,
      topicId: item?.topic?.id ?? fallbackTopicId,
      topicName: item?.topic?.name?.trim() || fallbackTopicName,
      totalQuestions: item?.total_questions ?? 0,
      correctAnswersCount: item?.correct_answers_count ?? 0,
      wrongAnswersCount: item?.wrong_answers_count ?? 0,
      scorePercentage: this.toNumber(item?.score_percentage),
      passed: item?.passed === true,
      startedAt: item?.started_at?.trim() || '',
      submittedAt: item?.submitted_at?.trim() || ''
    };
  }

  private mapQuizAttemptSummary(
    attemptId: number,
    topicId: number,
    topicName: string,
    item?: TeacherQuizAttemptSummaryApiItem | null
  ): TeacherQuizAttemptListItem {
    return {
      attemptId,
      topicId,
      topicName,
      totalQuestions: item?.total_questions ?? 0,
      correctAnswersCount: item?.correct_answers_count ?? 0,
      wrongAnswersCount: item?.wrong_answers_count ?? 0,
      scorePercentage: this.toNumber(item?.score_percentage),
      passed: item?.passed === true,
      startedAt: item?.started_at?.trim() || '',
      submittedAt: item?.submitted_at?.trim() || ''
    };
  }

  private mapQuizAttemptAnswer(item: TeacherQuizAttemptAnswerApiItem): TeacherQuizAttemptAnswer {
    return {
      questionId: item?.question_id ?? 0,
      questionText: item?.question_text?.trim() || 'Question',
      choices: (item?.choices ?? []).map((choice) => ({
        key: choice?.key?.trim() || '',
        text: choice?.text?.trim() || 'No answer text'
      })),
      selectedAnswer: item?.selected_answer?.trim() || '',
      selectedAnswerText: item?.selected_answer_text?.trim() || 'No answer selected',
      correctAnswer: item?.correct_answer?.trim() || '',
      correctAnswerText: item?.correct_answer_text?.trim() || item?.correct_answer?.trim() || '',
      isCorrect: item?.is_correct === true
    };
  }

  private toNumber(value: number | string | null | undefined): number {
    if (typeof value === 'number') {
      return value;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }
}
